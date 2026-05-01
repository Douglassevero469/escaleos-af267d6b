import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatsCard } from "@/components/ui/StatsCard";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Users, Target } from "lucide-react";
import { formatBRL } from "@/lib/finance-utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#7B2FF7", "#0000FF", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#10b981"];

export function FinanceDashboard() {
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

  const mrr = revenues.filter((r: any) => r.status === "active").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const fixedExp = expenses.filter((e: any) => e.active).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const teamCost = team.filter((t: any) => t.status === "active").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);
  const totalExp = fixedExp + teamCost;
  const result = mrr - totalExp;
  const activeClients = revenues.filter((r: any) => r.status === "active").length;
  const ticket = activeClients ? mrr / activeClients : 0;
  const activeTeam = team.filter((t: any) => t.status === "active").length;
  const costPerEmployee = activeTeam ? teamCost / activeTeam : 0;

  // 12 month series (mock baseado em dados atuais; futuro: agregar transactions reais)
  const monthSeries = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const variance = 0.85 + (i / 11) * 0.3;
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short" }),
      receita: Math.round(mrr * variance),
      despesa: Math.round(totalExp * (0.9 + (i / 11) * 0.2)),
      saldo: Math.round(mrr * variance - totalExp * (0.9 + (i / 11) * 0.2)),
    };
  });

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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="MRR" value={formatBRL(mrr)} icon={TrendingUp} positive change={`${activeClients} clientes`} />
        <StatsCard title="Despesas/mês" value={formatBRL(totalExp)} icon={TrendingDown} change={`Folha + fixos`} />
        <StatsCard title="Resultado" value={formatBRL(result)} icon={Wallet} positive={result >= 0} change={result >= 0 ? "Lucro" : "Prejuízo"} />
        <StatsCard title="Ticket Médio" value={formatBRL(ticket)} icon={Target} />
        <StatsCard title="Custo/Func." value={formatBRL(costPerEmployee)} icon={Users} change={`${activeTeam} ativos`} />
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
