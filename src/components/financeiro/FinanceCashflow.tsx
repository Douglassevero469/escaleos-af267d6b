import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Trash2, RefreshCw, ChevronDown, ChevronRight, History, CheckCircle2, XCircle, AlertCircle, Loader2, Clock } from "lucide-react";
import { formatBRL, STATUS_BADGE } from "@/lib/finance-utils";
import { Period } from "@/components/financeiro/PeriodFilter";
import { downloadCSV, generateBrandedPDF, fmt, monthBR } from "@/lib/finance-export";
import { toast } from "sonner";

interface Props { period: Period }

export function FinanceCashflow({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    mode: "replace" as "replace" | "append",
  });
  const [form, setForm] = useState<any>({
    kind: "expense", description: "", amount: 0,
    due_date: new Date().toISOString().slice(0, 10), status: "pending",
    payment_method: "", notes: "",
  });
  const autoTriedRef = useRef<Set<string>>(new Set());

  const { data: txs = [] } = useQuery({
    queryKey: ["fin-tx-cf"],
    queryFn: async () => (await supabase.from("finance_transactions").select("*").order("due_date", { ascending: false })).data || [],
  });
  const { data: revenues = [] } = useQuery({ queryKey: ["fin-rev-src"], queryFn: async () => (await supabase.from("finance_recurring_revenues").select("*")).data || [] });
  const { data: expenses = [] } = useQuery({ queryKey: ["fin-exp-src"], queryFn: async () => (await supabase.from("finance_recurring_expenses").select("*")).data || [] });
  const { data: team = [] } = useQuery({ queryKey: ["fin-team-src"], queryFn: async () => (await supabase.from("finance_team_members").select("*")).data || [] });
  const { data: runs = [] } = useQuery({
    queryKey: ["fin-runs"],
    queryFn: async () => (await supabase.from("finance_generation_runs").select("*").order("created_at", { ascending: false }).limit(50)).data || [],
  });
  const runsByMonth: Record<string, any> = {};
  runs.forEach((r: any) => { if (!runsByMonth[r.month]) runsByMonth[r.month] = r; });

  // Janela de meses do período selecionado (somente meses dentro de [period.start, period.end])
  const months: string[] = [];
  const startD = new Date(period.start);
  const endD = new Date(period.end);
  const cursor = new Date(startD.getFullYear(), startD.getMonth(), 1);
  while (cursor <= endD) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (months.length === 0) months.push(period.start.slice(0, 7));
  const monthsSet = new Set(months);

  // Apenas transações cujo due_date cai dentro do recorte exato [period.start, period.end]
  // E cujo mês está na janela (defesa redundante para custom ranges parciais).
  const txsInPeriod = txs.filter((t: any) => {
    if (!t?.due_date) return false;
    return t.due_date >= period.start && t.due_date <= period.end && monthsSet.has(t.due_date.slice(0, 7));
  });

  // Agrupa por mês somente o que está no período
  const byMonth: Record<string, any[]> = {};
  txsInPeriod.forEach((t: any) => {
    const key = t.due_date.slice(0, 7);
    (byMonth[key] = byMonth[key] || []).push(t);
  });

  // Projeção/linhas estritamente dentro da janela
  let acc = 0;
  const rows = months.map(month => {
    const items = byMonth[month] || [];
    const inc = items.filter(t => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
    const out = items.filter(t => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance = inc - out;
    acc += balance;
    return { month, inc, out, balance, acc, count: items.length };
  });

  async function runGeneration(month: string, mode: "replace" | "append", trigger: "manual" | "auto" = "manual") {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cashflow-month", {
        body: { month, mode, trigger },
      });
      if (error) throw error;
      if (data?.status === "success") {
        toast.success(`${data.inserted} lançamentos gerados (${month})`);
      } else if (data?.status === "partial") {
        toast.info(data.message || "Sem recorrências para gerar");
      } else if (data?.error) {
        toast.error(data.error);
      }
      qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
      qc.invalidateQueries({ queryKey: ["fin-tx"] });
      qc.invalidateQueries({ queryKey: ["fin-runs"] });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar");
    } finally {
      setGenerating(false);
    }
  }

  async function generate() {
    setGenForm({ month: new Date().toISOString().slice(0, 7), mode: "replace" });
    setGenOpen(true);
  }

  async function confirmGenerate() {
    setGenOpen(false);
    await runGeneration(genForm.month, genForm.mode, "manual");
  }

  // Auto-geração: quando o período só cobre o mês corrente e ele está vazio + sem run prévia
  useEffect(() => {
    if (months.length !== 1) return;
    const m = months[0];
    const today = new Date().toISOString().slice(0, 7);
    if (m !== today) return; // só auto-dispara para o mês atual
    if ((byMonth[m] || []).length > 0) return;
    if (runsByMonth[m]) return; // já tentou
    if (autoTriedRef.current.has(m)) return;
    if (!revenues.length && !expenses.length && !team.length) return;
    autoTriedRef.current.add(m);
    runGeneration(m, "replace", "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.join(","), txs.length, runs.length, revenues.length, expenses.length, team.length]);


  async function saveTx() {
    if (!form.description) return toast.error("Descrição obrigatória");
    const { error } = await supabase.from("finance_transactions").insert({
      ...form, user_id: user!.id, amount: Number(form.amount), reference_type: "manual",
    });
    if (error) return toast.error(error.message);
    toast.success("Lançamento adicionado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
    qc.invalidateQueries({ queryKey: ["fin-tx"] });
  }

  async function markPaid(t: any) {
    await supabase.from("finance_transactions").update({
      status: "paid", paid_date: new Date().toISOString().slice(0, 10),
    }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
  }

  async function removeTx(id: string) {
    if (!confirm("Excluir lançamento?")) return;
    await supabase.from("finance_transactions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
  }

  function exportCsv() {
    const headers = ["Mês", "Receita", "Despesa", "Saldo", "Acumulado", "Lançamentos"];
    const data = rows.map(x => [monthBR(x.month), Number(x.inc).toFixed(2), Number(x.out).toFixed(2), Number(x.balance).toFixed(2), Number(x.acc).toFixed(2), x.count]);
    downloadCSV(`fluxo-caixa-${period.start}-a-${period.end}`, headers, data);
    toast.success("CSV exportado");
  }

  async function exportPdf() {
    const totalInc = rows.reduce((s, r) => s + r.inc, 0);
    const totalOut = rows.reduce((s, r) => s + r.out, 0);
    const finalAcc = rows.length ? rows[rows.length - 1].acc : 0;
    await generateBrandedPDF({
      title: "Fluxo de Caixa",
      subtitle: "Projeção mês a mês de receitas, despesas e saldo acumulado",
      periodLabel: period.label,
      orientation: "portrait",
      sections: [
        {
          kpis: [
            { label: "Receita total", value: fmt(totalInc), accent: "#22c55e" },
            { label: "Despesa total", value: fmt(totalOut), accent: "#ef4444" },
            { label: "Resultado", value: fmt(totalInc - totalOut), accent: totalInc - totalOut >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Saldo acumulado", value: fmt(finalAcc) },
          ],
          table: {
            headers: ["Mês", "Receita", "Despesa", "Saldo", "Acumulado", "Lanç."],
            align: ["left", "right", "right", "right", "right", "center"],
            rows: rows.map(r => [monthBR(r.month), fmt(r.inc), fmt(r.out), fmt(r.balance), fmt(r.acc), r.count]),
            totalsRow: ["TOTAL", fmt(totalInc), fmt(totalOut), fmt(totalInc - totalOut), fmt(finalAcc), rows.reduce((s, r) => s + r.count, 0)],
          },
        },
      ],
    });
    toast.success("PDF gerado");
  }

  const monthLabel = (s: string) => {
    const [y, m] = s.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Fluxo de Caixa</p>
            <p className="text-sm text-muted-foreground capitalize">{period.label} · {months.length} {months.length === 1 ? "mês" : "meses"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />Histórico
              {runs.length > 0 && <span className="ml-2 text-xs text-muted-foreground">({runs.length})</span>}
            </Button>
            <Button variant="outline" onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Gerar mês
            </Button>
            <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Lançamento</Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Despesa</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Acumulado</TableHead>
              <TableHead className="text-center">Lanç.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <>
                <TableRow key={r.month} className="cursor-pointer" onClick={() => setExpanded(expanded === r.month ? null : r.month)}>
                  <TableCell>{expanded === r.month ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {monthLabel(r.month)}
                      {runsByMonth[r.month] && (
                        <RunStatusIcon status={runsByMonth[r.month].status} trigger={runsByMonth[r.month].trigger} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">{formatBRL(r.inc)}</TableCell>
                  <TableCell className="text-right font-mono text-rose-600">{formatBRL(r.out)}</TableCell>
                  <TableCell className={`text-right font-mono font-bold ${r.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatBRL(r.balance)}</TableCell>
                  <TableCell className={`text-right font-mono ${r.acc >= 0 ? "" : "text-rose-600"}`}>{formatBRL(r.acc)}</TableCell>
                  <TableCell className="text-center text-muted-foreground text-sm">{r.count}</TableCell>
                </TableRow>
                {expanded === r.month && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30 p-0">
                      <div className="p-3 space-y-1.5">
                        {(byMonth[r.month] || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">Sem lançamentos. Use "Gerar mês" para criar a partir das recorrências.</p>
                        ) : (
                          (byMonth[r.month] || []).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-sm bg-background rounded px-2 py-1.5">
                              <Badge variant="outline" className={STATUS_BADGE[t.status]}>{t.status}</Badge>
                              <span className="text-xs text-muted-foreground w-20">{t.due_date.slice(8)}/{t.due_date.slice(5, 7)}</span>
                              <span className="flex-1 truncate">{t.description}</span>
                              <span className={`font-mono text-xs ${t.kind === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                                {t.kind === "income" ? "+" : "-"}{formatBRL(Number(t.amount))}
                              </span>
                              {t.status === "pending" && (
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => markPaid(t)}>Pagar</Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeTx(t.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </GlassCard>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Novo Lançamento</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição *</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Método de pagamento</Label><Input value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} placeholder="PIX, Boleto, Cartão..." /></div>
            <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={saveTx} className="w-full">Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet: Gerar mês */}
      <Sheet open={genOpen} onOpenChange={setGenOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Gerar lançamentos do mês</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <p className="text-sm text-muted-foreground">
              Cria automaticamente os lançamentos a partir das receitas recorrentes, despesas fixas e folha de pagamento.
            </p>
            <div>
              <Label>Mês de referência</Label>
              <Input type="month" value={genForm.month} onChange={e => setGenForm({ ...genForm, month: e.target.value })} />
            </div>
            <div>
              <Label>Modo</Label>
              <Select value={genForm.mode} onValueChange={(v: "replace" | "append") => setGenForm({ ...genForm, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">Substituir (apaga gerados anteriormente)</SelectItem>
                  <SelectItem value="append">Adicionar (mantém existentes)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Lançamentos manuais são sempre preservados.
              </p>
            </div>
            <Button onClick={confirmGenerate} disabled={generating} className="w-full">
              {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</> : "Gerar agora"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet: Histórico */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Histórico de gerações</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-2">
            {runs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">
                Nenhuma execução ainda. Use "Gerar mês" para começar.
              </p>
            )}
            {runs.map((r: any) => (
              <div key={r.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RunStatusIcon status={r.status} trigger={r.trigger} />
                    <span className="font-medium">{r.month}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{r.trigger}</Badge>
                    <Badge variant="outline" className="text-[10px]">{r.mode}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{r.message || "—"}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>📥 {r.revenues_count} rec.</span>
                  <span>📤 {r.expenses_count} desp.</span>
                  <span>👥 {r.payroll_count} folha</span>
                  <span>+{r.total_inserted} criados</span>
                  {r.total_deleted > 0 && <span>−{r.total_deleted} substituídos</span>}
                  {Number(r.total_amount) > 0 && (
                    <span className="font-mono">{formatBRL(Number(r.total_amount))}</span>
                  )}
                  <Button
                    size="sm" variant="ghost" className="ml-auto h-7 text-xs"
                    onClick={() => runGeneration(r.month, r.mode, "manual")}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />Re-executar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RunStatusIcon({ status, trigger }: { status: string; trigger: string }) {
  const cls = "h-4 w-4";
  let icon, color = "", label = status;
  if (status === "success") { icon = <CheckCircle2 className={cls} />; color = "text-emerald-500"; label = "Sucesso"; }
  else if (status === "error") { icon = <XCircle className={cls} />; color = "text-rose-500"; label = "Erro"; }
  else if (status === "partial") { icon = <AlertCircle className={cls} />; color = "text-amber-500"; label = "Parcial"; }
  else if (status === "running") { icon = <Loader2 className={`${cls} animate-spin`} />; color = "text-primary"; label = "Executando"; }
  else { icon = <Clock className={cls} />; color = "text-muted-foreground"; }
  const triggerLabel = trigger === "auto" ? "automático" : trigger === "scheduled" ? "agendado" : "manual";
  return (
    <span className={color} title={`${label} · ${triggerLabel}`}>{icon}</span>
  );
}
