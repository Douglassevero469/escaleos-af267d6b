import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Users, Target, Download } from "lucide-react";
import { formatBRL } from "@/lib/finance-utils";
import { Period, monthsInPeriod, inPeriod } from "@/components/financeiro/PeriodFilter";
import { downloadCSV, generateBrandedPDF, fmt } from "@/lib/finance-export";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#7B2FF7", "#0000FF", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#10b981"];

interface Props { period: Period }

export function FinanceDashboard({ period }: Props) {
  const { data: revenues = [] } = useQuery({
    queryKey: ["fin-rev"],
    queryFn: async () => (await supabase.from("finance_recurring_revenues").select("*")).data || [],
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["fin-exp"],
    queryFn: async () => (await supabase.from("finance_recurring_expenses").select("*")).data || [],
  });
  const { data: team = [] } = useQuery({
    queryKey: ["fin-team"],
    queryFn: async () => (await supabase.from("finance_team_members").select("*")).data || [],
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["fin-tx"],
    queryFn: async () => (await supabase.from("finance_transactions").select("*").order("due_date")).data || [],
  });

  const months = monthsInPeriod(period);

  // Active items considered active during the period (start_date <= end & end_date null/>= start)
  const activeRevs = revenues.filter((r: any) =>
    r.status === "active" &&
    (!r.start_date || r.start_date <= period.end) &&
    (!r.end_date || r.end_date >= period.start)
  );
  const activeExps = expenses.filter((e: any) =>
    e.active &&
    (!e.start_date || e.start_date <= period.end) &&
    (!e.end_date || e.end_date >= period.start)
  );
  const activeTeamArr = team.filter((t: any) =>
    t.status === "active" &&
    (!t.start_date || t.start_date <= period.end)
  );

  const mrr = activeRevs.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const fixedExp = activeExps.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const teamCost = activeTeamArr.reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);
  const totalExp = fixedExp + teamCost;
  const result = mrr - totalExp;
  const activeClients = activeRevs.length;
  const ticket = activeClients ? mrr / activeClients : 0;
  const activeTeamCount = activeTeamArr.length;
  const costPerEmployee = activeTeamCount ? teamCost / activeTeamCount : 0;

  // Period totals (scaled by months in period)
  const periodRev = mrr * months;
  const periodExp = totalExp * months;
  const periodResult = periodRev - periodExp;

  // Series — granularidade adaptativa ao período
  const buildSeries = () => {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (months <= 1) {
      // Daily within month — usa transações reais quando há, senão distribui
      const days = end.getDate();
      return Array.from({ length: days }).map((_, i) => {
        const day = new Date(start.getFullYear(), start.getMonth(), i + 1);
        const ds = day.toISOString().slice(0, 10);
        const dayTx = txs.filter((t: any) => t.due_date === ds);
        const inc = dayTx.filter((t: any) => t.kind === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
        const out = dayTx.filter((t: any) => t.kind === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
        return { mes: String(i + 1).padStart(2, "0"), receita: inc, despesa: out, saldo: inc - out };
      });
    }
    // Monthly buckets
    const buckets: any[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const mStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const mTx = txs.filter((t: any) => t.due_date >= mStart.toISOString().slice(0, 10) && t.due_date <= mEnd.toISOString().slice(0, 10));
      const inc = mTx.filter((t: any) => t.kind === "income").reduce((s: number, t: any) => s + Number(t.amount), 0) || mrr;
      const out = mTx.filter((t: any) => t.kind === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0) || totalExp;
      buckets.push({
        mes: cursor.toLocaleDateString("pt-BR", { month: "short" }),
        receita: inc, despesa: out, saldo: inc - out,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  };
  const monthSeries = buildSeries();

  // Composição despesas
  const expByCat = [
    { name: "Folha", value: team.filter((t: any) => t.compensation_type === "salary").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0) },
    { name: "Prolabores", value: team.filter((t: any) => t.compensation_type === "prolabore").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0) },
    { name: "PJ/Freela", value: team.filter((t: any) => t.compensation_type === "contractor").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0) },
    ...expenses.filter((e: any) => e.active).map((e: any) => ({ name: e.name, value: Number(e.amount) })),
  ].filter(x => x.value > 0);

  // Top clientes
  const topClients = [...revenues]
    .filter((r: any) => r.status === "active")
    .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
    .slice(0, 8)
    .map((r: any) => ({ name: r.client_name, value: Number(r.amount) }));

  // Concentração risco
  const top3Sum = topClients.slice(0, 3).reduce((s, c) => s + c.value, 0);
  const concentration = mrr ? Math.round((top3Sum / mrr) * 100) : 0;

  // Próximos vencimentos
  const today = new Date();
  const in7days = new Date(); in7days.setDate(today.getDate() + 7);
  const upcoming = txs.filter((t: any) => {
    const due = new Date(t.due_date);
    return t.status === "pending" && due >= today && due <= in7days;
  }).reduce((s: number, t: any) => s + Number(t.amount), 0);

  const runway = result < 0 && totalExp ? Math.max(0, Math.floor(mrr / totalExp * 6)) : 999;

  function exportCsv() {
    const headers = ["Período", "Receita", "Despesa", "Saldo"];
    const rows = monthSeries.map((m: any) => [m.mes, Number(m.receita).toFixed(2), Number(m.despesa).toFixed(2), Number(m.saldo).toFixed(2)]);
    downloadCSV(`dashboard-financeiro-${period.start}-a-${period.end}`, headers, rows);
    toast.success("CSV exportado");
  }

  async function exportPdf() {
    await generateBrandedPDF({
      title: "Dashboard Financeiro",
      subtitle: "Visão executiva de receitas, despesas e indicadores estratégicos",
      periodLabel: period.label,
      sections: [
        {
          kpis: [
            { label: "MRR", value: fmt(mrr), accent: "#22c55e" },
            { label: "Despesas/mês", value: fmt(totalExp), accent: "#ef4444" },
            { label: "Resultado/mês", value: fmt(result), accent: result >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Ticket médio", value: fmt(ticket) },
            { label: "Custo/funcionário", value: fmt(costPerEmployee) },
            { label: "Runway", value: runway > 100 ? "∞" : `${runway} meses`, accent: runway > 6 ? "#22c55e" : "#ef4444" },
          ],
        },
        {
          title: "Resumo do período",
          table: {
            headers: ["Métrica", "Valor"],
            align: ["left", "right"],
            rows: [
              ["Receita no período", fmt(periodRev)],
              ["Despesa no período", fmt(periodExp)],
              ["Resultado no período", fmt(periodResult)],
              ["Clientes ativos", String(activeClients)],
              ["Equipe ativa", String(activeTeamCount)],
              ["Concentração Top 3", `${concentration}%`],
              ["A vencer (7 dias)", fmt(upcoming)],
            ],
          },
        },
        {
          title: "Série temporal",
          table: {
            headers: ["Período", "Receita", "Despesa", "Saldo"],
            align: ["left", "right", "right", "right"],
            rows: monthSeries.map((m: any) => [m.mes, fmt(m.receita), fmt(m.despesa), fmt(m.saldo)]),
          },
        },
        {
          title: "Top clientes (MRR)",
          table: {
            headers: ["Cliente", "Valor mensal", "% do MRR"],
            align: ["left", "right", "right"],
            rows: topClients.map((c) => [c.name, fmt(c.value), mrr ? `${((c.value / mrr) * 100).toFixed(1)}%` : "—"]),
          },
        },
      ],
    });
    toast.success("PDF gerado");
  }

  return (
    <div className="space-y-6">
      {/* Período resumo */}
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Período: <span className="capitalize text-foreground">{period.label}</span></p>
            <p className="text-xs text-muted-foreground">{period.start.split("-").reverse().join("/")} → {period.end.split("-").reverse().join("/")} · {months} {months === 1 ? "mês" : "meses"}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-right">
            <div><p className="text-xs text-muted-foreground">Receita período</p><p className="font-mono font-bold text-emerald-600">{formatBRL(periodRev)}</p></div>
            <div><p className="text-xs text-muted-foreground">Despesa período</p><p className="font-mono font-bold text-rose-600">{formatBRL(periodExp)}</p></div>
            <div><p className="text-xs text-muted-foreground">Resultado</p><p className={`font-mono font-bold ${periodResult >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatBRL(periodResult)}</p></div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
          </div>
        </div>
      </GlassCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="MRR" value={formatBRL(mrr)} icon={TrendingUp} positive change={`${activeClients} clientes`} />
        <StatsCard title="Despesas/mês" value={formatBRL(totalExp)} icon={TrendingDown} change={`Folha + fixos`} />
        <StatsCard title="Resultado/mês" value={formatBRL(result)} icon={Wallet} positive={result >= 0} change={result >= 0 ? "Lucro" : "Prejuízo"} />
        <StatsCard title="Ticket Médio" value={formatBRL(ticket)} icon={Target} />
        <StatsCard title="Custo/Func." value={formatBRL(costPerEmployee)} icon={Users} change={`${activeTeamCount} ativos`} />
        <StatsCard title="Runway" value={runway > 100 ? "∞" : `${runway}m`} icon={AlertTriangle} positive={runway > 6} change={runway > 6 ? "Saudável" : "Crítico"} />
      </div>

      {/* Alertas */}
      {(result < 0 || concentration > 50 || upcoming > 0) && (
        <GlassCard className="border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold">Alertas inteligentes</p>
              {result < 0 && (
                <p className="text-rose-600">• Despesas superam receitas em {formatBRL(Math.abs(result))}/mês</p>
              )}
              {concentration > 50 && (
                <p className="text-amber-600">• Top 3 clientes representam {concentration}% do MRR (concentração de risco)</p>
              )}
              {upcoming > 0 && (
                <p className="text-muted-foreground">• {formatBRL(upcoming)} em contas vencendo nos próximos 7 dias</p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Receita vs Despesa */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-semibold mb-4">Receita vs Despesa (12 meses)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2.5} name="Receita" />
              <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2.5} name="Despesa" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Saldo mensal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthSeries.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="saldo" radius={[8, 8, 0, 0]}>
                {monthSeries.slice(-6).map((m, i) => (
                  <Cell key={i} fill={m.saldo >= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Composição de despesas</h3>
          {expByCat.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Cadastre despesas e equipe para visualizar</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={expByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {expByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Top clientes (MRR)</h3>
          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Cadastre receitas para visualizar</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={90} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="#7B2FF7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
