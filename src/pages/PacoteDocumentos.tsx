import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Eye, CheckCircle, Loader2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";

const statusConfig = {
  ready: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Pronto" },
  pending: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Na fila..." },
  generating: { icon: Loader2, color: "text-accent", bg: "bg-accent/10", label: "Gerando..." },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erro" },
};

export default function PacoteDocumentos() {
  const { id } = useParams();
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({});
  const [generatingDocs, setGeneratingDocs] = useState<Set<string>>(new Set());
  const generationStarted = useRef(false);
  const queryClient = useQueryClient();

  const { data: pkg } = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data } = await supabase.from("packages").select("*, clients(name), briefings(data)").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["package-documents", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("package_id", id!)
        .order("created_at");
      return data ?? [];
    },
    refetchInterval: (query) => {
      const d = query.state.data as any[];
      if (d && d.some((doc: any) => doc.status === "pending" || doc.status === "generating")) return 5000;
      return false;
    },
  });

  const streamDocument = useCallback(async (doc: any, briefingData: any) => {
    const docId = doc.id;
    const docType = doc.doc_type;

    setGeneratingDocs(prev => new Set(prev).add(docId));
    setStreamingContent(prev => ({ ...prev, [docId]: "" }));

    // Mark as generating in DB
    await supabase.from("documents").update({ status: "generating" }).eq("id", docId);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ briefingData, docType }),
      });

      if (!resp.ok || !resp.body) {
        await supabase.from("documents").update({ status: "error" }).eq("id", docId);
        setGeneratingDocs(prev => { const n = new Set(prev); n.delete(docId); return n; });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setStreamingContent(prev => ({ ...prev, [docId]: content }));
            }
          } catch { /* partial */ }
        }
      }

      // Save to DB
      await supabase.from("documents").update({ content, status: "ready" }).eq("id", docId);
      queryClient.invalidateQueries({ queryKey: ["package-documents", id] });
    } catch (e) {
      console.error(`Error generating ${docType}:`, e);
      await supabase.from("documents").update({ status: "error" }).eq("id", docId);
    } finally {
      setGeneratingDocs(prev => { const n = new Set(prev); n.delete(docId); return n; });
    }
  }, [id, queryClient]);

  // Auto-start generation for pending docs (sequentially with delay to avoid rate limits)
  useEffect(() => {
    if (generationStarted.current || !pkg || !docs.length) return;
    const pendingDocs = docs.filter((d: any) => d.status === "pending");
    if (pendingDocs.length === 0) return;

    const briefingData = (pkg as any)?.briefings?.data;
    if (!briefingData) return;

    generationStarted.current = true;

    // Generate docs sequentially (2 at a time to balance speed/rate limits)
    const generateSequentially = async () => {
      const queue = [...pendingDocs];
      const concurrency = 2;

      const runNext = async () => {
        const doc = queue.shift();
        if (!doc) return;
        await streamDocument(doc, briefingData);
        // Small delay between docs
        await new Promise(r => setTimeout(r, 1500));
        await runNext();
      };

      const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => runNext());
      await Promise.all(workers);

      // Update package status
      await supabase.from("packages").update({ status: "ready" }).eq("id", id!);
      queryClient.invalidateQueries({ queryKey: ["package", id] });
    };

    generateSequentially();
  }, [docs, pkg, streamDocument, id, queryClient]);

  const completedCount = docs.filter((d: any) => d.status === "ready").length;
  const totalCount = docs.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isGenerating = generatingDocs.size > 0 || docs.some((d: any) => d.status === "pending" || d.status === "generating");

  const getDocContent = (doc: any) => {
    if (streamingContent[doc.id]) return streamingContent[doc.id];
    return doc.content || "";
  };

  const getDocStatus = (doc: any) => {
    if (generatingDocs.has(doc.id)) return "generating";
    return doc.status;
  };

  const retryDoc = async (doc: any) => {
    const briefingData = (pkg as any)?.briefings?.data;
    if (!briefingData) return;
    await streamDocument(doc, briefingData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pacote</h1>
          <p className="text-sm text-muted-foreground font-light">
            {(pkg as any)?.clients?.name ?? "..."} · {docs.length} documentos
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {isGenerating && totalCount > 0 && (
        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm font-medium">Gerando documentos com IA...</span>
            </div>
            <span className="text-xs text-muted-foreground">{completedCount}/{totalCount} concluídos</span>
          </div>
          <Progress value={progress} className="h-2" />
        </GlassCard>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : docs.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum documento neste pacote ainda</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map((doc: any) => {
            const status = getDocStatus(doc);
            const sc = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
            const StatusIcon = sc.icon;
            const content = getDocContent(doc);
            const isActive = generatingDocs.has(doc.id);
            const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

            return (
              <GlassCard key={doc.id} className={`space-y-4 transition-all ${isActive ? "ring-1 ring-accent/30" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    <StatusIcon className={`h-3 w-3 ${status === "pending" || status === "generating" ? "animate-spin" : ""}`} />
                    {sc.label}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{doc.title}</p>
                  {isActive && (
                    <p className="text-xs text-accent mt-1 animate-pulse">
                      {wordCount.toLocaleString()} palavras...
                    </p>
                  )}
                  {status === "ready" && wordCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{wordCount.toLocaleString()} palavras</p>
                  )}
                </div>

                {/* Live preview snippet while generating */}
                {isActive && content && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 max-h-[60px] overflow-hidden line-clamp-3">
                    {content.slice(-200)}
                  </div>
                )}

                <div className="flex gap-2">
                  {status === "error" ? (
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => retryDoc(doc)}>
                      <RefreshCw className="h-3 w-3" /> Tentar novamente
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1 gap-1"
                      disabled={status !== "ready" && !isActive}
                      onClick={() => setViewDoc({ ...doc, content: getDocContent(doc) })}>
                      <Eye className="h-3 w-3" /> {isActive ? "Ver ao vivo" : "Ver"}
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Document viewer dialog with markdown */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewDoc?.title}
              {generatingDocs.has(viewDoc?.id) && (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="prose prose-invert prose-sm max-w-none">
              <StreamingMarkdown
                content={viewDoc ? getDocContent(viewDoc) : ""}
                docId={viewDoc?.id}
                streamingContent={streamingContent}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Component that re-renders as streaming content updates */
function StreamingMarkdown({ content, docId, streamingContent }: { content: string; docId?: string; streamingContent: Record<string, string> }) {
  const [text, setText] = useState(content);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (docId && streamingContent[docId]) {
      setText(streamingContent[docId]);
    } else {
      setText(content);
    }
  }, [content, docId, streamingContent]);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [text]);

  if (!text) {
    return <p className="text-muted-foreground text-center py-8">Aguardando geração...</p>;
  }

  return (
    <div ref={scrollRef}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-xl font-display font-bold mt-6 mb-3 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-display font-semibold mt-5 mb-2 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-1 text-foreground">{children}</h4>,
          p: ({ children }) => <p className="text-sm text-foreground/90 mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-foreground/85">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse border border-border/40">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border/40 bg-muted/50 px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-border/40 px-3 py-2">{children}</td>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground mb-3">{children}</blockquote>,
          hr: () => <hr className="border-border/30 my-4" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
