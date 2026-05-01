import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/finance-utils";

/**
 * Barra fixa "Mês atual" — Executive Glass Console layout.
 * Usa tokens semânticos do design system para suportar light/dark mode.
 */
export function CurrentMonthBar() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const monthKey = monthStart.slice(0, 7);

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

  const mrr = revenues
    .filter((r: any) => r.status === "active" &&
      (!r.start_date || r.start_date <= monthEnd) &&
      (!r.end_date || r.end_date >= monthStart))
    .reduce((s: number, r: any) => s + Number(r.amount), 0);

  const fixedExp = expenses
    .filter((e: any) => e.active &&
      (!e.start_date || e.start_date <= monthEnd) &&
      (!e.end_date || e.end_date >= monthStart))
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  const teamCost = team
    .filter((t: any) => t.status === "active" && (!t.start_date || t.start_date <= monthEnd))
    .reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);

  const totalExp = fixedExp + teamCost;
  const txInc = txs.filter((t: any) => t.kind === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const txOut = txs.filter((t: any) => t.kind === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const realizedResult = txInc - txOut;
  const projectedResult = mrr - totalExp;
  const activeTeam = team.filter((t: any) => t.status === "active").length;
  const realizationPct = mrr > 0 ? Math.min(100, Math.round((txInc / mrr) * 100)) : 0;

  const cells = [
    { label: "Receita Projetada", value: formatBRL(mrr), highlight: false },
    { label: "Despesa Projetada", value: formatBRL(totalExp), highlight: false },
    { label: "Resultado Projetado", value: formatBRL(projectedResult), highlight: true, positive: projectedResult >= 0 },
    { label: "Realizado", value: formatBRL(realizedResult), badge: `${realizationPct}%`, badgePositive: realizedResult >= 0 },
    { label: "Equipe Ativa", value: String(activeTeam) },
  ];

  return (
    <div className="relative rounded-2xl glass-strong overflow-hidden shadow-[0_8px_32px_hsl(240_20%_4%/0.08)]">
      {/* subtle top edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`p-5 lg:p-6 flex flex-col gap-2 transition-colors hover:bg-foreground/[0.02] ${c.highlight ? "bg-gradient-to-b from-primary/5 to-transparent relative" : ""}`}
          >
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${c.highlight ? "text-primary" : "text-muted-foreground"}`}>
              {c.label}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-xl lg:text-2xl font-light tabular-nums tracking-tight truncate ${
                c.highlight
                  ? c.positive ? "text-foreground font-medium" : "text-destructive font-medium"
                  : "text-foreground"
              }`}>
                {c.value}
              </span>
              {c.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  c.badgePositive ? "bg-success/10 text-[hsl(var(--success))]" : "bg-destructive/10 text-destructive"
                }`}>
                  {c.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
