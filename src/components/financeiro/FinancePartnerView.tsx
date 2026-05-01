import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExecCard } from "@/components/financeiro/ExecPanel";
import { formatBRL } from "@/lib/finance-utils";
import { User } from "lucide-react";

/**
 * Partner Dashboard — shows individual prolabore distribution per socio.
 * Identifies socios as team members with compensation_type='prolabore' AND no manager.
 */
export function FinancePartnerView() {
  const { data: team = [] } = useQuery({
    queryKey: ["fin-team-partners"],
    queryFn: async () => (await supabase.from("finance_team_members").select("*")).data || [],
  });

  // Sócios = pró-labore sem gestor (top da hierarquia)
  const partners = team.filter((t: any) => t.compensation_type === "prolabore" && !t.manager_id && t.status === "active");
  const totalProlabore = partners.reduce((s: number, p: any) => s + Number(p.monthly_cost), 0);

  if (partners.length === 0) {
    return (
      <ExecCard title="Visão por Sócio" subtitle="Distribuição de pró-labore">
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum sócio identificado. Cadastre membros como <strong>pró-labore sem gestor</strong> em Equipe.
        </p>
      </ExecCard>
    );
  }

  return (
    <ExecCard
      title="Visão por Sócio"
      subtitle={`${partners.length} sócios · Total mensal ${formatBRL(totalProlabore)}`}
      info="Visão individualizada de cada sócio (membro com pró-labore sem gestor superior). Mostra distribuição mensal e participação relativa. Útil para revisão trimestral de remuneração."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {partners.map((p: any) => {
          const pct = totalProlabore ? (Number(p.monthly_cost) / totalProlabore) * 100 : 0;
          return (
            <div key={p.id} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name || p.role}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.role}</p>
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Pró-labore mensal</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <p className="text-lg font-semibold tabular-nums">{formatBRL(Number(p.monthly_cost))}</p>
                <div className="mt-2 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider">Anual</p>
                  <p className="tabular-nums font-medium">{formatBRL(Number(p.monthly_cost) * 12)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider">13º (×13)</p>
                  <p className="tabular-nums font-medium">{formatBRL(Number(p.monthly_cost) * 13)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ExecCard>
  );
}
