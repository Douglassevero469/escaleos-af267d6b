import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Eye, CheckCircle, Loader2, AlertCircle, RefreshCw, Download, Archive } from "lucide-react";
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
import JSZip from "jszip";

const statusConfig = {
  ready: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Pronto" },
  pending: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Na fila..." },
  generating: { icon: Loader2, color: "text-accent", bg: "bg-accent/10", label: "Gerando..." },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erro" },
};

function downloadAsText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function markdownToHtml(md: string): string {
  let html = md
    // Tables: convert markdown tables to HTML
    .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_match, header, body) => {
      const ths = header.split("|").map((h: string) => h.trim()).filter(Boolean).map((h: string) => `<th>${h}</th>`).join("");
      const rows = body.trim().split("\n").map((row: string) => {
        const tds = row.split("|").map((c: string) => c.trim()).filter(Boolean).map((c: string) => `<td>${c}</td>`).join("");
        return `<tr>${tds}</tr>`;
      }).join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    // Headers
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr/>")
    // List items
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\s*)+)/g, (m) => `<ul>${m}</ul>`)
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Paragraphs - wrap remaining lines
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[htulo])/gm, (line) => line ? `<p>${line}</p>` : "");

  return html;
}

const ESCALE_BRAND_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  :root {
    --brand-blue: #0000FF;
    --brand-dark: #0A0A14;
    --brand-gray: #8A8A9A;
    --brand-light: #F0F0F5;
    --brand-border: #E0E0EA;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: A4;
    margin: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1A1A2E;
    line-height: 1.7;
    font-size: 10.5pt;
    background: white;
  }

  .page {
    padding: 48px 56px 80px;
    max-width: 100%;
    position: relative;
    min-height: 100vh;
  }

  /* ── Header ── */
  .doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
    margin-bottom: 32px;
    border-bottom: 2px solid var(--brand-blue);
  }

  .logo-mark {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-mark .logo-text {
    font-size: 20px;
    font-weight: 800;
    color: var(--brand-dark);
    letter-spacing: -0.5px;
  }

  .logo-mark .logo-arrow {
    color: var(--brand-blue);
    font-size: 16px;
    font-weight: 700;
    margin-left: -4px;
    transform: rotate(-45deg);
    display: inline-block;
  }

  .doc-meta {
    text-align: right;
    font-size: 8.5pt;
    color: var(--brand-gray);
    line-height: 1.5;
  }

  /* ── Title area ── */
  .doc-title-area {
    margin-bottom: 36px;
    padding: 28px 32px;
    background: linear-gradient(135deg, #F5F5FF 0%, #EBEBFF 100%);
    border-radius: 12px;
    border-left: 4px solid var(--brand-blue);
  }

  .doc-title-area h1 {
    font-size: 22pt;
    font-weight: 800;
    color: var(--brand-dark);
    margin: 0 0 4px;
    letter-spacing: -0.5px;
    border: none;
    padding: 0;
  }

  .doc-title-area .subtitle {
    font-size: 10pt;
    color: var(--brand-gray);
    font-weight: 400;
  }

  /* ── Content ── */
  h1 {
    font-size: 17pt;
    font-weight: 700;
    color: var(--brand-dark);
    margin: 32px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid var(--brand-border);
    letter-spacing: -0.3px;
  }

  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: var(--brand-blue);
    margin: 28px 0 10px;
    letter-spacing: -0.2px;
  }

  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #2A2A4A;
    margin: 22px 0 8px;
  }

  h4 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #3A3A5A;
    margin: 18px 0 6px;
  }

  p {
    margin: 0 0 10px;
    color: #2A2A4A;
  }

  strong {
    font-weight: 600;
    color: var(--brand-dark);
  }

  em { color: #4A4A6A; }

  ul, ol {
    padding-left: 22px;
    margin: 8px 0 16px;
  }

  li {
    margin: 5px 0;
    color: #2A2A4A;
    line-height: 1.6;
  }

  li::marker {
    color: var(--brand-blue);
    font-weight: 700;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0 24px;
    font-size: 9.5pt;
    border-radius: 8px;
    overflow: hidden;
  }

  thead tr {
    background: var(--brand-blue);
  }

  th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    color: white;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--brand-border);
    color: #2A2A4A;
  }

  tbody tr:nth-child(even) {
    background: #F8F8FC;
  }

  tbody tr:hover {
    background: #F0F0FF;
  }

  /* ── Blockquotes ── */
  blockquote {
    border-left: 3px solid var(--brand-blue);
    padding: 12px 16px;
    margin: 16px 0;
    background: #F8F8FC;
    border-radius: 0 6px 6px 0;
    color: #3A3A5A;
    font-style: italic;
  }

  hr {
    border: none;
    height: 1px;
    background: var(--brand-border);
    margin: 24px 0;
  }

  /* ── Footer ── */
  .doc-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 56px;
    background: var(--brand-dark);
    color: rgba(255,255,255,0.5);
    font-size: 7.5pt;
    letter-spacing: 0.3px;
  }

  .doc-footer .brand {
    color: rgba(255,255,255,0.8);
    font-weight: 600;
  }

  @media print {
    .doc-footer { position: fixed; }
    .page { padding-bottom: 60px; }
  }
`;

function buildBrandedHtml(title: string, content: string): string {
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title} — EscaleOS</title>
  <style>${ESCALE_BRAND_CSS}</style>
</head>
<body>
  <div class="page">
    <div class="doc-header">
      <div class="logo-mark">
        <span class="logo-text">escale</span><span class="logo-arrow">↗</span>
      </div>
      <div class="doc-meta">
        <div>EscaleOS · Documento Gerado por IA</div>
        <div>${today}</div>
      </div>
    </div>

    <div class="doc-title-area">
      <h1 style="border:none;margin:0;padding:0;">${title}</h1>
      <div class="subtitle">Documento gerado automaticamente pelo EscaleOS</div>
    </div>

    <div class="doc-content">
      ${markdownToHtml(content)}
    </div>
  </div>

  <div class="doc-footer">
    <span class="brand">escale↗</span>
    <span>Documento confidencial · Gerado pelo EscaleOS</span>
    <span>${today}</span>
  </div>
</body>
</html>`;
}

function downloadAsPdf(title: string, content: string) {
  const html = buildBrandedHtml(title, content);
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 600);
  }
}

function downloadAsDocx(title: string, content: string) {
  const html = buildBrandedHtml(title, content);
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadAllAsZip(docs: any[], clientName: string) {
  const zip = new JSZip();
  const readyDocs = docs.filter((d: any) => d.status === "ready" && d.content);

  for (const doc of readyDocs) {
    const safeTitle = doc.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "_");
    // Add markdown
    zip.file(`${safeTitle}.md`, doc.content);
    // Add branded HTML (for opening in browser / printing as PDF)
    zip.file(`${safeTitle}.html`, buildBrandedHtml(doc.title, doc.content));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const safeName = clientName.replace(/\s+/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Pacote_${safeName}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

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
                    <>
                      <Button variant="outline" size="sm" className="flex-1 gap-1"
                        disabled={status !== "ready" && !isActive}
                        onClick={() => setViewDoc({ ...doc, content: getDocContent(doc) })}>
                        <Eye className="h-3 w-3" /> {isActive ? "Ver ao vivo" : "Ver"}
                      </Button>
                      {status === "ready" && content && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 px-2">
                              <Download className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadAsPdf(doc.title, content)}>
                              Baixar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadAsDocx(doc.title, content)}>
                              Baixar DOCX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadAsText(`${doc.title.replace(/\s+/g, "_")}.md`, content)}>
                              Baixar Markdown
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
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
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {viewDoc?.title}
                {generatingDocs.has(viewDoc?.id) && (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                )}
              </DialogTitle>
              {viewDoc?.content && viewDoc?.status === "ready" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => downloadAsPdf(viewDoc.title, getDocContent(viewDoc))}>PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadAsDocx(viewDoc.title, getDocContent(viewDoc))}>DOCX</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadAsText(`${viewDoc.title.replace(/\s+/g, "_")}.md`, getDocContent(viewDoc))}>Markdown</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
