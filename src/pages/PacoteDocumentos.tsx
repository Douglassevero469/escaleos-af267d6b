import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Download, Eye, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";

const mockDocs = [
  { id: 1, title: "Plano Comercial Estratégico", status: "pronto" as const, pages: 12 },
  { id: 2, title: "Proposta Comercial", status: "pronto" as const, pages: 8 },
  { id: 3, title: "Roteiro de Vendas", status: "pronto" as const, pages: 6 },
  { id: 4, title: "Script de Prospecção", status: "pronto" as const, pages: 4 },
  { id: 5, title: "Plano de Marketing", status: "pronto" as const, pages: 10 },
  { id: 6, title: "Análise de Concorrência", status: "gerando" as const, pages: 0 },
  { id: 7, title: "Análise SWOT", status: "gerando" as const, pages: 0 },
  { id: 8, title: "Resumo Executivo", status: "erro" as const, pages: 0 },
];

const statusConfig = {
  pronto: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Pronto" },
  gerando: { icon: Loader2, color: "text-warning", bg: "bg-warning/10", label: "Gerando..." },
  erro: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erro" },
};

export default function PacoteDocumentos() {
  const { id } = useParams();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pacote #{id}</h1>
          <p className="text-sm text-muted-foreground font-light">Studio Fitness Prime · 8 documentos</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Baixar ZIP
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockDocs.map(doc => {
          const sc = statusConfig[doc.status];
          const StatusIcon = sc.icon;
          return (
            <GlassCard key={doc.id} className="hover-scale space-y-4">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                  <StatusIcon className={`h-3 w-3 ${doc.status === "gerando" ? "animate-spin" : ""}`} />
                  {sc.label}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">{doc.title}</p>
                {doc.pages > 0 && <p className="text-xs text-muted-foreground">{doc.pages} páginas</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" disabled={doc.status !== "pronto"}>
                  <Eye className="h-3 w-3" /> Ver
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" disabled={doc.status !== "pronto"}>
                  <Download className="h-3 w-3" /> Baixar
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
