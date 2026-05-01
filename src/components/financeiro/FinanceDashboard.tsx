import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExecHeader, ExecCard } from "@/components/financeiro/ExecPanel";
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

const COLORS = ["hsl(265 92% 58%)", "hsl(240 100% 60%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(330 81% 60%)", "hsl(189 94% 43%)", "hsl(280 70% 55%)", "hsl(160 84% 39%)"];

const chartTooltipStyle = {
  background: "hsl(var(--card) / 0.95)",
  backdropFilter: "blur(12px)",
  border: "1px solid hsl(var(--border) / 0.6)",
  borderRadius: 12,
  boxShadow: "0 8px 32px hsl(240 20% 4% / 0.12)",
  padding: "10px 14px",
  fontSize: 12,
} as const;

const axisTickStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 } as const;

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
      <ExecHeader
        tag="Dashboard Executivo"
        title="Visão Geral do Negócio"
        subtitle={`${period.label} · ${period.start.split("-").reverse().join("/")} → ${period.end.split("-").reverse().join("/")} · ${months} ${months === 1 ? "mês" : "meses"}`}
        kpis={[
          { label: "Resultado", value: formatBRL(periodResult), highlight: true, positive: periodResult >= 0 },
          { label: "Receita no período", value: formatBRL(periodRev) },
          { label: "Despesa no período", value: formatBRL(periodExp), positive: false },
          { label: "Runway", value: runway > 100 ? "∞" : `${runway}m`, positive: runway > 6 },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
          </>
        }
      />

      {/* KPIs detalhados */}
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 md:gap-4">
        <StatsCard title="MRR" value={formatBRL(mrr)} icon={TrendingUp} positive change={`${activeClients} clientes`} info="MRR (Monthly Recurring Revenue) é a receita recorrente mensal proveniente de contratos ativos. Indica a previsibilidade de faturamento do negócio." />
        <StatsCard title="Despesas/mês" value={formatBRL(totalExp)} icon={TrendingDown} change={`Folha + fixos`} info="Soma de todas as despesas mensais previstas, incluindo folha de pagamento, custos fixos recorrentes e variáveis." />
        <StatsCard title="Resultado/mês" value={formatBRL(result)} icon={Wallet} positive={result >= 0} change={result >= 0 ? "Lucro" : "Prejuízo"} info="Diferença entre receita mensal (MRR) e despesas mensais. Resultado positivo indica lucro; negativo, prejuízo operacional." />
        <StatsCard title="Ticket Médio" value={formatBRL(ticket)} icon={Target} info="Valor médio cobrado por cliente ativo (MRR ÷ número de clientes). Mede o poder de monetização da carteira." />
        <StatsCard title="Custo/Func." value={formatBRL(costPerEmployee)} icon={Users} change={`${activeTeamCount} ativos`} info="Custo médio mensal por colaborador ativo. Inclui salários, pró-labore e outras formas de remuneração cadastradas na equipe." />
        <StatsCard title="Runway" value={runway > 100 ? "∞" : `${runway}m`} icon={AlertTriangle} positive={runway > 6} change={runway > 6 ? "Saudável" : "Crítico"} info="Runway (cash runway) é o tempo, em meses, que a empresa consegue operar com o caixa atual considerando o ritmo de queima (burn rate). Acima de 6 meses é considerado saudável." />
      </div>

      {/* Alertas */}
      {(result < 0 || concentration > 50 || upcoming > 0) && (
        <ExecCard title="Alertas Inteligentes" info="Sinais automáticos sobre a saúde financeira do negócio: runway curto, prejuízo no mês, churn relevante e outras métricas críticas que merecem atenção imediata.">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-sm">
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
        </ExecCard>
      )}

      {/* Receita vs Despesa */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ExecCard title="Receita vs Despesa" subtitle={period.label} info="Comparativo mês a mês entre receitas recebidas e despesas pagas no período selecionado. Permite identificar tendências de crescimento, sazonalidade e meses deficitários.">
          <div className="flex items-center gap-4 mb-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[hsl(142_71%_45%)]" />
              <span className="text-muted-foreground">Receita</span>
              <span className="text-foreground tabular-nums">{formatBRL(periodRev)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[hsl(0_84%_60%)]" />
              <span className="text-muted-foreground">Despesa</span>
              <span className="text-foreground tabular-nums">{formatBRL(periodExp)}</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthSeries} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-receita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-despesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.6)" vertical={false} />
              <XAxis dataKey="mes" tick={axisTickStyle} axisLine={false} tickLine={false} dy={6} />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={42} />
              <Tooltip
                formatter={(v: number, name: string) => [formatBRL(v), name === "receita" ? "Receita" : "Despesa"]}
                contentStyle={chartTooltipStyle}
                cursor={{ stroke: "hsl(var(--primary) / 0.2)", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="receita" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#grad-receita)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="despesa" stroke="hsl(0 84% 60%)" strokeWidth={2.5} fill="url(#grad-despesa)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ExecCard>

        <ExecCard title="Saldo Mensal" subtitle="Últimos 6 períodos" info="Resultado líquido (receita - despesa) acumulado de cada mês nos últimos 6 períodos. Barras verdes indicam meses lucrativos; vermelhas, meses deficitários.">
          <div className="flex items-center gap-4 mb-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[hsl(142_71%_45%)]" />
              <span className="text-muted-foreground">Lucro</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[hsl(0_84%_60%)]" />
              <span className="text-muted-foreground">Prejuízo</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthSeries.slice(-6)} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="bar-positive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 55%)" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(142 71% 40%)" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="bar-negative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 84% 65%)" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(0 84% 50%)" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.6)" vertical={false} />
              <XAxis dataKey="mes" tick={axisTickStyle} axisLine={false} tickLine={false} dy={6} />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={42} />
              <Tooltip
                formatter={(v: number) => [formatBRL(v), "Saldo"]}
                contentStyle={chartTooltipStyle}
                cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
              />
              <Bar dataKey="saldo" radius={[8, 8, 2, 2]} maxBarSize={48}>
                {monthSeries.slice(-6).map((m, i) => (
                  <Cell key={i} fill={m.saldo >= 0 ? "url(#bar-positive)" : "url(#bar-negative)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ExecCard>

        <ExecCard title="Composição de Despesas" subtitle="Por categoria">
          {expByCat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Cadastre despesas e equipe para visualizar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <defs>
                    {COLORS.map((c, i) => (
                      <linearGradient key={i} id={`pie-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={expByCat}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={58}
                    paddingAngle={3}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {expByCat.map((_, i) => <Cell key={i} fill={`url(#pie-grad-${i % COLORS.length})`} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 text-xs md:max-w-[180px]">
                {expByCat.slice(0, 6).map((cat, i) => {
                  const total = expByCat.reduce((s, c) => s + c.value, 0);
                  const pct = total ? ((cat.value / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={i} className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate flex-1">{cat.name}</span>
                      <span className="text-foreground font-medium tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ExecCard>

        <ExecCard title="Maiores Origens" subtitle="Top clientes (MRR)">
          {topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Cadastre receitas para visualizar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, topClients.length * 36)}>
              <BarChart data={topClients} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="bar-client" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.6)" horizontal={false} />
                <XAxis type="number" tick={axisTickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={110} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [formatBRL(v), "MRR"]}
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
                />
                <Bar dataKey="value" fill="url(#bar-client)" radius={[0, 8, 8, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ExecCard>
      </div>
    </div>
  );
}
