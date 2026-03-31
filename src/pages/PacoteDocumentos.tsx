import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Download, Eye, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusConfig = {
  ready: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Pronto" },
  pending: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Gerando..." },
  generating: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Gerando..." },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erro" },
};

export default function PacoteDocumentos() {
  const { id } = useParams();
  const [viewDoc, setViewDoc] = useState<any>(null);

  const { data: pkg } = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data } = await supabase.from("packages").select("*, clients(name)").eq("id", id!).maybeSingle();
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
      if (d && d.some((doc: any) => doc.status === "pending" || doc.status === "generating")) return 3000;
      return false;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pacote</h1>
          <p className="text-sm text-muted-foreground font-light">{(pkg as any)?.clients?.name ?? "..."} · {docs.length} documentos</p>
        </div>
      </div>

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
            const sc = statusConfig[doc.status as keyof typeof statusConfig] ?? statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <GlassCard key={doc.id} className="hover-scale space-y-4">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    <StatusIcon className={`h-3 w-3 ${doc.status === "pending" || doc.status === "generating" ? "animate-spin" : ""}`} />
                    {sc.label}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.doc_type}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" disabled={doc.status !== "ready"} onClick={() => setViewDoc(doc)}>
                    <Eye className="h-3 w-3" /> Ver
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
              {viewDoc?.content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
