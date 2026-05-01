import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { CalendarCheck2, TrendingUp, TrendingDown, Wallet, Users } from "lucide-react";
import { formatBRL } from "@/lib/finance-utils";

/**
 * Barra fixa "Mês atual" — exibe sempre os totais do mês corrente,
 * independente do filtro de período aplicado nas abas.
 */
export function CurrentMonthBar() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const monthKey = monthStart.slice(0, 7);
  const label = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const { data: revenues = [] } = useQuery({
    queryKey: ["fin-cm-rev"],
    queryFn: async () => (await supabase.from("finance_recurring_revenues").select("*")).data || [],
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["fin-cm-exp"],
    queryFn: async () => (await supabase.from("finance_recurring_expenses").select("*")).data || [],
  });
  const { data: team = [] } = useQuery({
    queryKey: ["fin-cm-team"],
    queryFn: async () => (await supabase.from("finance_team_members").select("*")).data || [],
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["fin-cm-tx", monthKey],
    queryFn: async () =>
      (await supabase
        .from("finance_transactions")
        .select("*")
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd)).data || [],
  });

  // Totais recorrentes ativos no mês atual
  const mrr = revenues
    .filter((r: any) =>
      r.status === "active" &&
      (!r.start_date || r.start_date <= monthEnd) &&
      (!r.end_date || r.end_date >= monthStart)
    )
    .reduce((s: number, r: any) => s + Number(r.amount), 0);

  const fixedExp = expenses
    .filter((e: any) =>
      e.active &&
      (!e.start_date || e.start_date <= monthEnd) &&
      (!e.end_date || e.end_date >= monthStart)
    )
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  const teamCost = team
    .filter((t: any) => t.status === "active" && (!t.start_date || t.start_date <= monthEnd))
    .reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);

  const totalExp = fixedExp + teamCost;

  // Realizado a partir das transações
  const txInc = txs.filter((t: any) => t.kind === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const txOut = txs.filter((t: any) => t.kind === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const realizedResult = txInc - txOut;
  const projectedResult = mrr - totalExp;

  const items = [
    { icon: TrendingUp, label: "Receita projetada", value: formatBRL(mrr), color: "text-emerald-600" },
    { icon: TrendingDown, label: "Despesas projetadas", value: formatBRL(totalExp), color: "text-rose-600" },
    { icon: Wallet, label: "Resultado projetado", value: formatBRL(projectedResult), color: projectedResult >= 0 ? "text-emerald-600" : "text-rose-600" },
    { icon: Users, label: "Equipe ativa", value: String(team.filter((t: any) => t.status === "active").length), color: "text-foreground" },
    { icon: TrendingUp, label: "Realizado (mês)", value: formatBRL(realizedResult), color: realizedResult >= 0 ? "text-emerald-600" : "text-rose-600" },
  ];

  return (
    <GlassCard className="!p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-md bg-primary/10 p-1.5">
          <CalendarCheck2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">Mês atual</p>
          <p className="text-sm font-semibold capitalize leading-tight">{label}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 min-w-0">
            <it.icon className={`h-4 w-4 shrink-0 ${it.color} opacity-70`} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none truncate">{it.label}</p>
              <p className={`text-sm font-bold font-mono leading-tight truncate ${it.color}`}>{it.value}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
