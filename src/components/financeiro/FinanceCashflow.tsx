import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExecHeader, ExecCard } from "@/components/financeiro/ExecPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Download, Trash2, RefreshCw, ChevronDown, ChevronRight, History, CheckCircle2, XCircle, AlertCircle, Loader2, Clock, AlertTriangle } from "lucide-react";
import { formatBRL, STATUS_BADGE } from "@/lib/finance-utils";
import { Period } from "@/components/financeiro/PeriodFilter";
import { downloadCSV, generateBrandedPDF, fmt, monthBR } from "@/lib/finance-export";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BulkPayBar } from "@/components/financeiro/BulkPayBar";
import { AttachmentUpload } from "@/components/financeiro/AttachmentUpload";
import { TagsInput } from "@/components/financeiro/TagsInput";

interface Props { period: Period }

export function FinanceCashflow({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
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
    payment_method: "", notes: "", tags: [] as string[], attachment_url: null as string | null,
    installments: 1, interest_rate: 0, fine_rate: 0, early_discount_rate: 0,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [partial, setPartial] = useState<{ tx: any; amount: number } | null>(null);
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
    const installments = Math.max(1, Number(form.installments) || 1);

    if (installments > 1) {
      const { error } = await supabase.rpc("create_installments", {
        _user_id: user!.id,
        _kind: form.kind,
        _description: form.description,
        _total_amount: Number(form.amount),
        _first_due: form.due_date,
        _installments: installments,
        _category_id: null,
        _notes: form.notes,
        _tags: form.tags,
      });
      if (error) return toast.error(error.message);
      toast.success(`${installments} parcelas criadas`);
    } else {
      const { error } = await supabase.from("finance_transactions").insert({
        kind: form.kind, description: form.description, amount: Number(form.amount),
        original_amount: Number(form.amount),
        due_date: form.due_date, status: form.status, payment_method: form.payment_method,
        notes: form.notes, tags: form.tags, attachment_url: form.attachment_url,
        interest_rate: Number(form.interest_rate) || 0,
        fine_rate: Number(form.fine_rate) || 0,
        early_discount_rate: Number(form.early_discount_rate) || 0,
        user_id: user!.id, reference_type: "manual",
      });
      if (error) return toast.error(error.message);
      toast.success("Lançamento adicionado");
    }
    setOpen(false);
    setForm({ kind: "expense", description: "", amount: 0, due_date: new Date().toISOString().slice(0, 10), status: "pending", payment_method: "", notes: "", tags: [], attachment_url: null, installments: 1, interest_rate: 0, fine_rate: 0, early_discount_rate: 0 });
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
    qc.invalidateQueries({ queryKey: ["fin-tx"] });
  }

  async function markPaid(t: any) {
    // Calcula valor com juros/multa/desconto via RPC
    const { data: dueAmount } = await supabase.rpc("calculate_transaction_due_amount", { _tx_id: t.id });
    const amt = Number(dueAmount ?? t.amount);
    if (Math.abs(amt - Number(t.amount)) > 0.01) {
      const ok = await confirm({
        title: "Confirmar valor de pagamento",
        description: `Valor calculado: ${formatBRL(amt)} (original ${formatBRL(Number(t.amount))} ${amt > t.amount ? "+ juros/multa" : "− desconto"}). Marcar como pago?`,
        confirmText: "Confirmar",
      });
      if (!ok) return;
    }
    await supabase.from("finance_transactions").update({
      status: "paid", paid_date: new Date().toISOString().slice(0, 10), partial_paid_amount: Number(t.amount),
    }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
  }

  async function doPartialPay() {
    if (!partial) return;
    const { error } = await supabase.rpc("partial_pay_transaction", {
      _tx_id: partial.tx.id, _amount: partial.amount, _paid_date: new Date().toISOString().slice(0, 10),
    });
    if (error) return toast.error(error.message);
    toast.success("Baixa parcial registrada");
    setPartial(null);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
  }

  async function removeTx(id: string) {
    if (!(await confirm({ title: "Excluir lançamento?", description: "Este lançamento será removido permanentemente. Esta ação não poderá ser desfeita.", confirmText: "Excluir" }))) return;
    await supabase.from("finance_transactions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
  }

  // Helpers para alertas de vencimento
  const todayISO = new Date().toISOString().slice(0, 10);
  function dueAlert(t: any): { label: string; tone: "danger" | "warn" } | null {
    if (t.status !== "pending" || !t.due_date) return null;
    if (t.due_date < todayISO) return { label: "Vencido", tone: "danger" };
    const diff = Math.round((new Date(t.due_date).getTime() - new Date(todayISO).getTime()) / 86400000);
    if (diff <= 7) return { label: `Vence em ${diff}d`, tone: "warn" };
    return null;
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const selectedIds = Array.from(selected);
  const selectedTotal = txsInPeriod
    .filter((t: any) => selected.has(t.id))
    .reduce((s: number, t: any) => s + Number(t.amount), 0);

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

  const totalInc = rows.reduce((s, r) => s + r.inc, 0);
  const totalOut = rows.reduce((s, r) => s + r.out, 0);
  const finalAcc = rows.length ? rows[rows.length - 1].acc : 0;

  // Alertas de vencimento (todas pendentes do período)
  const overdueCount = txsInPeriod.filter((t: any) => t.status === "pending" && t.due_date < todayISO).length;
  const dueSoonCount = txsInPeriod.filter((t: any) => {
    if (t.status !== "pending" || t.due_date < todayISO) return false;
    const d = Math.round((new Date(t.due_date).getTime() - new Date(todayISO).getTime()) / 86400000);
    return d <= 7;
  }).length;

  return (
    <div className="space-y-6">
      <ExecHeader
        tag="Fluxo de Caixa"
        title="Projeção & Realizado"
        subtitle={`${period.label} · ${months.length} ${months.length === 1 ? "mês" : "meses"}`}
        kpis={[
          { label: "Resultado", value: formatBRL(totalInc - totalOut), highlight: true, positive: totalInc - totalOut >= 0 },
          { label: "Receitas", value: formatBRL(totalInc) },
          { label: "Despesas", value: formatBRL(totalOut), positive: false },
          { label: "Saldo Acumulado", value: formatBRL(finalAcc), positive: finalAcc >= 0 },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />Histórico
              {runs.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({runs.length})</span>}
            </Button>
            <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Gerar mês
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Lançamento</Button>
          </>
        }
      />

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {overdueCount > 0 && (
              <span className="text-foreground">
                <span className="font-bold text-destructive">{overdueCount}</span> lançamento{overdueCount > 1 ? "s" : ""} <span className="text-destructive font-medium">vencido{overdueCount > 1 ? "s" : ""}</span>
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="text-foreground">
                <span className="font-bold text-amber-500">{dueSoonCount}</span> vencendo nos próximos 7 dias
              </span>
            )}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">Expanda os meses para revisar e marcar como pago.</span>
        </div>
      )}

      <ExecCard title="Evolução mês a mês" subtitle="Clique em uma linha para detalhar" padded={false}>
        <div className="border-t border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent bg-muted/20">
                <TableHead className="h-11 w-10 px-5 lg:px-6"></TableHead>
                <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Mês</TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Receita</TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Despesa</TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Saldo</TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Acumulado</TableHead>
                <TableHead className="h-11 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-5 lg:px-6">Lanç.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <>
                  <TableRow
                    key={r.month}
                    className="border-border/50 cursor-pointer transition-colors hover:bg-foreground/[0.025]"
                    onClick={() => setExpanded(expanded === r.month ? null : r.month)}
                  >
                    <TableCell className="py-4 px-5 lg:px-6 text-muted-foreground">
                      {expanded === r.month ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {monthLabel(r.month)}
                        {runsByMonth[r.month] && (
                          <RunStatusIcon status={runsByMonth[r.month].status} trigger={runsByMonth[r.month].trigger} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right tabular-nums text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]">{formatBRL(r.inc)}</TableCell>
                    <TableCell className="py-4 text-right tabular-nums text-destructive">{formatBRL(r.out)}</TableCell>
                    <TableCell className={`py-4 text-right tabular-nums font-semibold ${r.balance >= 0 ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]" : "text-destructive"}`}>{formatBRL(r.balance)}</TableCell>
                    <TableCell className={`py-4 text-right tabular-nums ${r.acc >= 0 ? "text-foreground" : "text-destructive"}`}>{formatBRL(r.acc)}</TableCell>
                    <TableCell className="py-4 text-center text-sm text-muted-foreground px-5 lg:px-6">{r.count}</TableCell>
                  </TableRow>
                  {expanded === r.month && (
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-muted/20 p-0">
                        <div className="px-5 lg:px-6 py-4 space-y-1.5">
                          {(byMonth[r.month] || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-6">Sem lançamentos. Use "Gerar mês" para criar a partir das recorrências.</p>
                          ) : (
                            (byMonth[r.month] || []).map(t => {
                              const alert = dueAlert(t);
                              const isSel = selected.has(t.id);
                              return (
                              <div key={t.id} className={`flex items-center gap-3 text-sm bg-background/60 backdrop-blur-sm border rounded-lg px-3 py-2 transition-colors ${isSel ? "border-primary/60 bg-primary/5" : "border-border/40"}`}>
                                {t.status === "pending" && (
                                  <Checkbox
                                    checked={isSel}
                                    onCheckedChange={() => toggleSelect(t.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="shrink-0"
                                  />
                                )}
                                <Badge variant="outline" className={`${STATUS_BADGE[t.status]} font-medium border-0 text-[10px]`}>{t.status}</Badge>
                                <span className="text-xs text-muted-foreground tabular-nums w-14">{t.due_date.slice(8)}/{t.due_date.slice(5, 7)}</span>
                                {alert && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-semibold border-0 ${alert.tone === "danger" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}
                                  >
                                    {alert.label}
                                  </Badge>
                                )}
                                <span className="flex-1 truncate text-foreground">
                                  {t.description}
                                  {t.attachment_url && (
                                    <a href={t.attachment_url} target="_blank" rel="noreferrer" className="inline-block ml-1.5 align-middle text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()} title="Ver anexo">📎</a>
                                  )}
                                  {Array.isArray(t.tags) && t.tags.length > 0 && (
                                    <span className="ml-2 inline-flex gap-1 align-middle">
                                      {t.tags.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                                      ))}
                                    </span>
                                  )}
                                </span>
                                <span className={`tabular-nums font-medium text-xs ${t.kind === "income" ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]" : "text-destructive"}`}>
                                  {t.kind === "income" ? "+" : "-"}{formatBRL(Number(t.amount))}
                                </span>
                                {t.status === "pending" && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markPaid(t)}>Pagar</Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={() => removeTx(t.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExecCard>

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
            <div>
              <Label>Tags / Centro de Custo</Label>
              <TagsInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="ex: cliente-x, projeto-y" />
            </div>
            <div>
              <Label>Comprovante / NF</Label>
              <AttachmentUpload value={form.attachment_url} onChange={(url) => setForm({ ...form, attachment_url: url })} />
            </div>
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

      <BulkPayBar
        selectedIds={selectedIds}
        selectedTotal={selectedTotal}
        onClear={() => setSelected(new Set())}
        onDone={() => setSelected(new Set())}
      />
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
