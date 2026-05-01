import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExecCard } from "@/components/financeiro/ExecPanel";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  snapshot: any;
  period: string;
}

/** AI-powered strategic insights panel. Calls finance-ai-insights edge function. */
export function FinanceAIInsights({ snapshot, period }: Props) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("finance-ai-insights", {
        body: { snapshot, period },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsight(data.insight);
      setGeneratedAt(data.generated_at);
      toast.success("Análise gerada");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar análise");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ExecCard
      title="Análise Estratégica com IA"
      subtitle={
        generatedAt
          ? `Gerada em ${new Date(generatedAt).toLocaleString("pt-BR")}`
          : "Receba diagnóstico, riscos e recomendações personalizadas"
      }
      info="A IA analisa todos os indicadores do dashboard (MRR, churn, margem, concentração, forecast etc.) e gera um diagnóstico estratégico com pontos fortes, riscos e ações concretas. Use sempre que quiser uma segunda opinião sobre a saúde do negócio."
      actions={
        <Button onClick={analyze} disabled={loading} size="sm" variant={insight ? "outline" : "default"}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analisando...</>
          ) : insight ? (
            <><RefreshCw className="mr-2 h-4 w-4" />Atualizar análise</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Analisar com IA</>
          )}
        </Button>
      }
    >
      {!insight && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Clique em <strong>Analisar com IA</strong> para receber um diagnóstico completo do CFO virtual com base
            nos seus números atuais.
          </p>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Analisando 16 KPIs e cruzando dados...</span>
        </div>
      )}
      {insight && (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-medium prose-p:leading-relaxed prose-strong:text-foreground prose-li:my-1">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      )}
    </ExecCard>
  );
}
