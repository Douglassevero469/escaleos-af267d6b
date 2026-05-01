import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { ExecHeader, ExecCard } from "@/components/financeiro/ExecPanel";
import { FinanceAIInsights } from "@/components/financeiro/FinanceAIInsights";
import { FinanceDRE } from "@/components/financeiro/FinanceDRE";
import { FinanceCashflowHeatmap } from "@/components/financeiro/FinanceCashflowHeatmap";
import { FinanceScenarios } from "@/components/financeiro/FinanceScenarios";
import { FinancePartnerView } from "@/components/financeiro/FinancePartnerView";
import { Period, monthsInPeriod } from "@/components/financeiro/PeriodFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, AlertTriangle, FileText, Download } from "lucide-react";
import { formatBRL } from "@/lib/finance-utils";
import { generateBrandedPDF, fmt } from "@/lib/finance-export";
import { toast } from "sonner";

interface Props { period: Period }

/** Insights tab — aggregates AI analysis, DRE, scenarios, heatmap, partner view, settings, and accountant export. */
export function FinanceInsights({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

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
  const { data: settingsRows = [] } = useQuery({
    queryKey: ["fin-settings"],
    queryFn: async () => (await supabase.from("finance_settings").select("*").limit(1)).data || [],
  });

  // Calcular snapshot
  const months = monthsInPeriod(period);
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
  const burnRate = result < 0 ? Math.abs(result) : 0;
  const netMargin = mrr > 0 ? (result / mrr) * 100 : 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const cashCurrent = txs
    .filter((t: any) => t.status === "paid" && t.paid_date && t.paid_date <= todayStr)
    .reduce((s: number, t: any) => s + (t.kind === "income" ? Number(t.amount) : -Number(t.amount)), 0);

  const today = new Date();
  const in7days = new Date(); in7days.setDate(today.getDate() + 7);
  const upcoming7d = txs.filter((t: any) => {
    const due = new Date(t.due_date);
    return t.status === "pending" && due >= today && due <= in7days;
  }).reduce((s: number, t: any) => s + Number(t.amount), 0);

  const churnedInPeriod = revenues.filter((r: any) =>
    r.end_date && r.end_date >= period.start && r.end_date <= period.end
  ).length;
  const churnBase = activeClients + churnedInPeriod;
  const churnRate = churnBase > 0 ? (churnedInPeriod / churnBase) * 100 : 0;

  const prevStart = new Date(period.start); prevStart.setMonth(prevStart.getMonth() - months);
  const prevActiveRevs = revenues.filter((r: any) =>
    r.status === "active" &&
    (!r.start_date || r.start_date <= period.start) &&
    (!r.end_date || r.end_date >= prevStart.toISOString().slice(0, 10))
  );
  const prevMrr = prevActiveRevs.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const mrrGrowth = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : (mrr > 0 ? 100 : 0);

  const payrollPct = mrr > 0 ? (teamCost / mrr) * 100 : 0;

  const topClients = [...revenues].filter((r: any) => r.status === "active")
    .sort((a: any, b: any) => Number(b.amount) - Number(a.amount)).slice(0, 5)
    .map((r: any) => ({ name: r.client_name, value: Number(r.amount) }));
  const top3Sum = topClients.slice(0, 3).reduce((s, c) => s + c.value, 0);
  const concentration = mrr ? Math.round((top3Sum / mrr) * 100) : 0;

  const topExpenses = [...activeExps]
    .sort((a: any, b: any) => Number(b.amount) - Number(a.amount)).slice(0, 5)
    .map((e: any) => ({ name: e.name, value: Number(e.amount) }));

  // Forecast simplificado
  let forecast30 = cashCurrent + result;
  let forecast60 = cashCurrent + result * 2;
  let forecast90 = cashCurrent + result * 3;
  const forecastNegativeDay = result < 0 && cashCurrent + result * 3 < 0
    ? `~${Math.ceil(Math.abs(cashCurrent / result))} dias` : null;

  // Marketing exp = soma das despesas com vendor "Marketing" ou "Tráfego"
  const marketingExp = activeExps
    .filter((e: any) => /market|tráfego|trafego|ads/i.test(e.vendor || "") || /market|tráfego|trafego|ads/i.test(e.name || ""))
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  const snapshot = {
    mrr, totalExp, result, cashCurrent, burnRate, netMargin, churnRate,
    mrrGrowth, payrollPct, concentration, topClients, topExpenses,
    upcoming7d, forecast30, forecast60, forecast90, forecastNegativeDay,
    activeClients, activeTeam: activeTeamArr.length, ticket,
  };

  // Settings
  const settings = settingsRows[0] || null;
  const [threshold, setThreshold] = useState<number>(5000);
  const [enabled, setEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setThreshold(Number(settings.approval_threshold));
      setEnabled(settings.approval_enabled);
    }
  }, [settings]);

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const payload = { user_id: user!.id, approval_threshold: threshold, approval_enabled: enabled };
      const { error } = settings?.id
        ? await supabase.from("finance_settings").update(payload).eq("id", settings.id)
        : await supabase.from("finance_settings").insert(payload);
      if (error) throw error;
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["fin-settings"] });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setSavingSettings(false);
    }
  }

  // Pendentes de aprovação
  const pendingApproval = txs.filter((t: any) => t.approval_status === "pending");

  // Risco de churn — receitas ativas sem pagamento há > 45 dias
  const churnRisk = activeRevs.filter((r: any) => {
    const lastPayment = txs.find((t: any) =>
      t.status === "paid" && t.kind === "income" &&
      (t.description || "").toLowerCase().includes((r.client_name || "").toLowerCase())
    );
    if (!lastPayment) return false;
    const days = Math.floor((Date.now() - new Date(lastPayment.paid_date).getTime()) / (1000 * 60 * 60 * 24));
    return days > 45;
  });

  // Reajuste anual pendente
  const adjustmentDue = activeRevs.filter((r: any) => {
    if (!r.annual_adjustment_index || r.annual_adjustment_index === "none") return false;
    const ref = r.last_adjustment_date || r.start_date;
    if (!ref) return false;
    const monthsDiff = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsDiff >= 12;
  });

  async function exportAccountantReport() {
    const monthlyTx = txs.filter((t: any) => t.due_date >= period.start && t.due_date <= period.end);
    const incomes = monthlyTx.filter((t: any) => t.kind === "income");
    const expensesT = monthlyTx.filter((t: any) => t.kind === "expense");
    const totalIn = incomes.reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalOut = expensesT.reduce((s: number, t: any) => s + Number(t.amount), 0);

    await generateBrandedPDF({
      title: "Relatório Contábil",
      subtitle: "Movimentação financeira para fins de fechamento mensal",
      periodLabel: period.label,
      sections: [
        {
          kpis: [
            { label: "Receitas", value: fmt(totalIn), accent: "#22c55e" },
            { label: "Despesas", value: fmt(totalOut), accent: "#ef4444" },
            { label: "Resultado", value: fmt(totalIn - totalOut), accent: totalIn - totalOut >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Lançamentos", value: String(monthlyTx.length) },
          ],
        },
        {
          title: "Receitas detalhadas",
          table: {
            headers: ["Data", "Descrição", "Status", "Valor"],
            align: ["left", "left", "center", "right"],
            rows: incomes.map((t: any) => [
              new Date(t.due_date).toLocaleDateString("pt-BR"),
              t.description, t.status, fmt(Number(t.amount)),
            ]),
            totalsRow: ["TOTAL", "", "", fmt(totalIn)],
          },
        },
        {
          title: "Despesas detalhadas",
          table: {
            headers: ["Data", "Descrição", "Status", "Valor"],
            align: ["left", "left", "center", "right"],
            rows: expensesT.map((t: any) => [
              new Date(t.due_date).toLocaleDateString("pt-BR"),
              t.description, t.status, fmt(Number(t.amount)),
            ]),
            totalsRow: ["TOTAL", "", "", fmt(totalOut)],
          },
        },
      ],
    });
    toast.success("Relatório contábil gerado");
  }

  return (
    <div className="space-y-6">
      <ExecHeader
        tag="Inteligência Financeira"
        title="Insights & Cenários"
        subtitle="Análises avançadas, simulações, configurações e exportações"
        kpis={[
          { label: "Resultado/mês", value: formatBRL(result), highlight: true, positive: result >= 0 },
          { label: "Caixa atual", value: formatBRL(cashCurrent), positive: cashCurrent >= 0 },
          { label: "Pendentes aprovação", value: String(pendingApproval.length), positive: pendingApproval.length === 0 },
          { label: "Risco churn", value: String(churnRisk.length), positive: churnRisk.length === 0 },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={exportAccountantReport}>
            <FileText className="mr-2 h-4 w-4" />
            Relatório contábil
          </Button>
        }
      />

      {/* Alertas */}
      {(pendingApproval.length > 0 || churnRisk.length > 0 || adjustmentDue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pendingApproval.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Despesas aguardando aprovação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingApproval.length} despesa(s) acima do limite ({formatBRL(threshold)}) precisam de aprovação de sócio.
                </p>
              </div>
            </div>
          )}
          {churnRisk.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Risco de churn detectado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {churnRisk.length} cliente(s) sem pagamento há mais de 45 dias.
                </p>
              </div>
            </div>
          )}
          {adjustmentDue.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reajuste anual pendente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {adjustmentDue.length} contrato(s) completaram 12 meses e podem ser reajustados.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IA Insights */}
      <FinanceAIInsights snapshot={snapshot} period={period.label} />

      {/* DRE + Heatmap lado a lado */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FinanceDRE mrr={mrr} teamCost={teamCost} fixedExp={fixedExp - marketingExp} marketingExp={marketingExp} />
        <FinanceCashflowHeatmap transactions={txs} />
      </div>

      {/* Cenários */}
      <FinanceScenarios baseMRR={mrr} baseExp={totalExp} baseCash={cashCurrent} />

      {/* Visão por sócio */}
      <FinancePartnerView />

      {/* Configurações */}
      <ExecCard
        title="Configurações de Aprovação"
        subtitle="Workflow de despesas que precisam de aprovação de sócio"
        info="Despesas acima do limite definido aqui ficam em status 'aguardando aprovação' e só usuários com role 'sócio' ou 'admin' podem aprovar. Mantém controle sobre gastos relevantes."
        actions={
          <Button onClick={saveSettings} disabled={savingSettings} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {savingSettings ? "Salvando..." : "Salvar"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <div>
              <Label className="font-medium">Workflow de aprovação</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bloqueia despesas acima do limite até aprovação de sócio
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="p-3 rounded-lg border border-border/50">
            <Label className="font-medium">Limite de aprovação (R$)</Label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              min={0}
              step={500}
              className="mt-2"
              disabled={!enabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Despesas acima de <strong>{formatBRL(threshold)}</strong> precisarão ser aprovadas
            </p>
          </div>
        </div>
      </ExecCard>
    </div>
  );
}
