import { useState } from "react";
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
import { Plus, Download, Trash2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { formatBRL, STATUS_BADGE } from "@/lib/finance-utils";
import { Period } from "@/components/financeiro/PeriodFilter";
import { toast } from "sonner";

interface Props { period: Period }

export function FinanceCashflow({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    kind: "expense", description: "", amount: 0,
    due_date: new Date().toISOString().slice(0, 10), status: "pending",
    payment_method: "", notes: "",
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["fin-tx-cf"],
    queryFn: async () => (await supabase.from("finance_transactions").select("*").order("due_date", { ascending: false })).data || [],
  });
  const { data: revenues = [] } = useQuery({ queryKey: ["fin-rev-src"], queryFn: async () => (await supabase.from("finance_recurring_revenues").select("*")).data || [] });
  const { data: expenses = [] } = useQuery({ queryKey: ["fin-exp-src"], queryFn: async () => (await supabase.from("finance_recurring_expenses").select("*")).data || [] });
  const { data: team = [] } = useQuery({ queryKey: ["fin-team-src"], queryFn: async () => (await supabase.from("finance_team_members").select("*")).data || [] });

  // Group txs by month
  const byMonth: Record<string, any[]> = {};
  txs.forEach((t: any) => {
    const key = t.due_date.slice(0, 7);
    (byMonth[key] = byMonth[key] || []).push(t);
  });

  // Build 12 months window (6 past, current, 5 future)
  const months: string[] = [];
  const base = new Date();
  for (let i = -6; i <= 5; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  let acc = 0;
  const rows = months.map(month => {
    const items = byMonth[month] || [];
    const inc = items.filter(t => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
    const out = items.filter(t => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance = inc - out;
    acc += balance;
    return { month, inc, out, balance, acc, count: items.length };
  });

  async function generate() {
    const month = prompt("Gerar lançamentos para qual mês? (YYYY-MM)", new Date().toISOString().slice(0, 7));
    if (!month) return;
    const [y, m] = month.split("-").map(Number);
    const items: any[] = [];

    revenues.filter((r: any) => r.status === "active").forEach((r: any) => {
      items.push({
        user_id: user!.id, kind: "income", description: `${r.client_name} — Mensalidade`,
        amount: Number(r.amount), due_date: `${month}-${String(r.payment_day || 5).padStart(2, "0")}`,
        status: "pending", reference_type: "recurring_revenue", reference_id: r.id,
      });
    });
    expenses.filter((e: any) => e.active).forEach((e: any) => {
      items.push({
        user_id: user!.id, kind: "expense", description: `${e.name}${e.vendor ? ` (${e.vendor})` : ""}`,
        amount: Number(e.amount), due_date: `${month}-${String(e.payment_day || 5).padStart(2, "0")}`,
        status: "pending", reference_type: "recurring_expense", reference_id: e.id,
      });
    });
    team.filter((t: any) => t.status === "active" && Number(t.monthly_cost) > 0).forEach((t: any) => {
      items.push({
        user_id: user!.id, kind: "expense",
        description: `${t.name || t.role} — ${t.compensation_type === "salary" ? "Salário" : t.compensation_type === "prolabore" ? "Pró-labore" : "PJ"}`,
        amount: Number(t.monthly_cost), due_date: `${month}-05`, status: "pending",
        reference_type: "team_payroll", reference_id: t.id,
      });
    });

    if (!items.length) return toast.error("Nenhum item recorrente para gerar");

    // Avoid duplicates: delete existing for this month with reference
    const start = `${month}-01`; const end = `${month}-31`;
    await supabase.from("finance_transactions").delete()
      .gte("due_date", start).lte("due_date", end).neq("reference_type", "manual");

    const { error } = await supabase.from("finance_transactions").insert(items);
    if (error) return toast.error(error.message);
    toast.success(`${items.length} lançamentos gerados para ${month}`);
    qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
    qc.invalidateQueries({ queryKey: ["fin-tx"] });
  }

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
    const r = [["Mês", "Receita", "Despesa", "Saldo", "Acumulado"]];
    rows.forEach(x => r.push([x.month, String(x.inc), String(x.out), String(x.balance), String(x.acc)]));
    const csv = r.map(rr => rr.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fluxo-caixa.csv"; a.click();
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
            <p className="text-sm text-muted-foreground">12 meses (6 passados + atual + 5 projeções)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" onClick={generate}><RefreshCw className="mr-2 h-4 w-4" />Gerar mês</Button>
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
                  <TableCell className="font-medium">{monthLabel(r.month)}</TableCell>
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
    </div>
  );
}
