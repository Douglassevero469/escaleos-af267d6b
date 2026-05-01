import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExecHeader, ExecCard } from "@/components/financeiro/ExecPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatBRL } from "@/lib/finance-utils";
import { Period } from "@/components/financeiro/PeriodFilter";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";

interface Props { period: Period }

export function FinanceBudgets({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    category_id: "",
    reference_month: period.start.slice(0, 7),
    planned_amount: 0,
    alert_threshold: 80,
    notes: "",
  });

  const refMonth = period.start.slice(0, 7);

  const { data: budgets = [] } = useQuery({
    queryKey: ["fin-budgets", refMonth],
    queryFn: async () =>
      (await supabase.from("finance_budgets").select("*").eq("reference_month", refMonth)).data || [],
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["fin-cats-budget"],
    queryFn: async () =>
      (await supabase.from("finance_categories").select("*").eq("kind", "expense")).data || [],
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["fin-tx-budget", refMonth],
    queryFn: async () => {
      const start = `${refMonth}-01`;
      const next = new Date(refMonth + "-01");
      next.setMonth(next.getMonth() + 1);
      const end = next.toISOString().slice(0, 10);
      return (
        await supabase
          .from("finance_transactions")
          .select("category_id, amount, kind")
          .eq("kind", "expense")
          .gte("due_date", start)
          .lt("due_date", end)
      ).data || [];
    },
  });

  const realByCat: Record<string, number> = {};
  txs.forEach((t: any) => {
    const k = t.category_id || "__none__";
    realByCat[k] = (realByCat[k] || 0) + Number(t.amount);
  });

  const catName = (id: string) => categories.find((c: any) => c.id === id)?.name || "Sem categoria";
  const catColor = (id: string) => categories.find((c: any) => c.id === id)?.color || "#7B2FF7";

  async function save() {
    if (!form.planned_amount) return toast.error("Informe um valor planejado");
    const payload = {
      user_id: user!.id,
      category_id: form.category_id || null,
      reference_month: form.reference_month,
      planned_amount: Number(form.planned_amount),
      alert_threshold: Number(form.alert_threshold),
      notes: form.notes,
    };
    const { error } = await supabase
      .from("finance_budgets")
      .upsert(payload, { onConflict: "user_id,category_id,reference_month" });
    if (error) return toast.error(error.message);
    toast.success("Orçamento salvo");
    setOpen(false);
    setForm({
      category_id: "",
      reference_month: refMonth,
      planned_amount: 0,
      alert_threshold: 80,
      notes: "",
    });
    qc.invalidateQueries({ queryKey: ["fin-budgets"] });
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "Excluir orçamento?", confirmText: "Excluir" }))) return;
    await supabase.from("finance_budgets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["fin-budgets"] });
  }

  const totalPlanned = budgets.reduce((s: number, b: any) => s + Number(b.planned_amount), 0);
  const totalReal = budgets.reduce(
    (s: number, b: any) => s + (realByCat[b.category_id || "__none__"] || 0),
    0
  );
  const overBudgetCount = budgets.filter((b: any) => {
    const real = realByCat[b.category_id || "__none__"] || 0;
    return real > Number(b.planned_amount);
  }).length;

  return (
    <div className="space-y-6">
      <ExecHeader
        tag="Orçamento"
        title="Previsto x Realizado"
        subtitle={`${period.label} · ${budgets.length} categoria(s) com orçamento`}
        kpis={[
          { label: "Planejado", value: formatBRL(totalPlanned), highlight: true },
          { label: "Realizado", value: formatBRL(totalReal), positive: totalReal <= totalPlanned },
          {
            label: "Saldo",
            value: formatBRL(totalPlanned - totalReal),
            positive: totalPlanned - totalReal >= 0,
          },
          { label: "Estouros", value: String(overBudgetCount), positive: overBudgetCount === 0 },
        ]}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo orçamento
          </Button>
        }
      />

      <ExecCard title="Acompanhamento do mês" padded={false}>
        <div className="border-t border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/20 hover:bg-transparent">
                <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Categoria
                </TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Planejado
                </TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Realizado
                </TableHead>
                <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Saldo
                </TableHead>
                <TableHead className="h-11 w-[260px] text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Uso
                </TableHead>
                <TableHead className="h-11 w-[90px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                    Nenhum orçamento para {refMonth}. Clique em "Novo orçamento" para criar.
                  </TableCell>
                </TableRow>
              )}
              {budgets.map((b: any) => {
                const planned = Number(b.planned_amount);
                const real = realByCat[b.category_id || "__none__"] || 0;
                const pct = planned > 0 ? Math.round((real / planned) * 100) : 0;
                const over = real > planned;
                const warn = pct >= b.alert_threshold;
                return (
                  <TableRow key={b.id} className="border-border/50">
                    <TableCell className="py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ background: catColor(b.category_id) }}
                        />
                        {catName(b.category_id)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums">{formatBRL(planned)}</TableCell>
                    <TableCell className="py-3 text-right tabular-nums">{formatBRL(real)}</TableCell>
                    <TableCell
                      className={`py-3 text-right tabular-nums font-semibold ${
                        planned - real >= 0 ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]" : "text-destructive"
                      }`}
                    >
                      {formatBRL(planned - real)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(pct, 100)}
                          className={over ? "[&>div]:bg-destructive" : warn ? "[&>div]:bg-amber-500" : ""}
                        />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground tabular-nums">{pct}%</span>
                          {over ? (
                            <Badge variant="outline" className="border-0 bg-destructive/15 text-destructive text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Estourou
                            </Badge>
                          ) : warn ? (
                            <Badge
                              variant="outline"
                              className="border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]"
                            >
                              Atenção
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Saudável
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ExecCard>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Orçamento</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mês de referência</Label>
              <Input
                type="month"
                value={form.reference_month}
                onChange={(e) => setForm({ ...form, reference_month: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor planejado</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.planned_amount}
                  onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Alerta (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.alert_threshold}
                  onChange={(e) => setForm({ ...form, alert_threshold: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={save} className="w-full">
              Salvar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
