import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExecHeader, ExecCard } from "@/components/financeiro/ExecPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Download, Calendar } from "lucide-react";
import { formatBRL, EXPENSE_CATEGORIES } from "@/lib/finance-utils";
import { Period, monthsInPeriod } from "@/components/financeiro/PeriodFilter";
import { downloadCSV, generateBrandedPDF, fmt } from "@/lib/finance-export";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface ExpForm {
  id?: string;
  name: string;
  description: string;
  amount: number;
  payment_day: number;
  vendor: string;
  active: boolean;
  category: string;
  start_date: string;
  duration_months: number; // 0 = indefinida
}

const empty: ExpForm = {
  name: "", description: "", amount: 0, payment_day: 5,
  vendor: "", active: true, category: "Sistemas",
  start_date: new Date().toISOString().slice(0, 10),
  duration_months: 0,
};

interface Props { period: Period }

export function FinanceExpenses({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExpForm>(empty);

  const { data: expensesAll = [] } = useQuery({
    queryKey: ["fin-expenses"],
    queryFn: async () => (await supabase.from("finance_recurring_expenses").select("*").order("amount", { ascending: false })).data || [],
  });

  // Vigentes no período
  const expenses = expensesAll.filter((e: any) =>
    (!e.start_date || e.start_date <= period.end) &&
    (!e.end_date || e.end_date >= period.start)
  );

  const months = monthsInPeriod(period);
  const total = expenses.filter((e: any) => e.active).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalPeriod = total * months;

  // Group by category (using description as proxy until categories table is wired)
  const grouped = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    items: expenses.filter((e: any) => (e.description || "").startsWith(`[${cat}]`) || e.vendor === cat),
  })).filter(g => g.items.length > 0);

  const ungrouped = expenses.filter((e: any) =>
    !EXPENSE_CATEGORIES.some(c => (e.description || "").startsWith(`[${c}]`) || e.vendor === c)
  );

  async function save() {
    if (!form.name) return toast.error("Informe o nome");
    const payload = {
      user_id: user!.id,
      name: form.name,
      description: `[${form.category}] ${form.description}`.trim(),
      amount: Number(form.amount),
      payment_day: Number(form.payment_day),
      vendor: form.vendor || form.category,
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from("finance_recurring_expenses").update(payload).eq("id", form.id)
      : await supabase.from("finance_recurring_expenses").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Despesa salva");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["fin-expenses"] });
    qc.invalidateQueries({ queryKey: ["fin-exp"] });
  }

  async function toggle(e: any) {
    await supabase.from("finance_recurring_expenses").update({ active: !e.active }).eq("id", e.id);
    qc.invalidateQueries({ queryKey: ["fin-expenses"] });
    qc.invalidateQueries({ queryKey: ["fin-exp"] });
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "Excluir despesa?", description: "Esta despesa será removida permanentemente. Esta ação não poderá ser desfeita.", confirmText: "Excluir" }))) return;
    await supabase.from("finance_recurring_expenses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["fin-expenses"] });
    qc.invalidateQueries({ queryKey: ["fin-exp"] });
  }

  function openEdit(e: any) {
    const catMatch = EXPENSE_CATEGORIES.find(c => (e.description || "").startsWith(`[${c}]`)) || "Outros";
    setForm({
      id: e.id, name: e.name,
      description: (e.description || "").replace(`[${catMatch}] `, ""),
      amount: Number(e.amount), payment_day: e.payment_day || 5,
      vendor: e.vendor, active: e.active, category: catMatch,
    });
    setOpen(true);
  }

  const sections = [...grouped, ...(ungrouped.length ? [{ cat: "Sem categoria", items: ungrouped }] : [])];

  function exportCsv() {
    const headers = ["Categoria", "Nome", "Fornecedor", "Valor mensal", "Dia pgto", "Ativa", "Total no período"];
    const rows: (string | number)[][] = [];
    sections.forEach(sec => {
      sec.items.forEach((e: any) => {
        rows.push([sec.cat, e.name, e.vendor || "", Number(e.amount).toFixed(2), e.payment_day || "", e.active ? "Sim" : "Não", (Number(e.amount) * months).toFixed(2)]);
      });
    });
    downloadCSV(`despesas-${period.start}-a-${period.end}`, headers, rows);
    toast.success("CSV exportado");
  }

  async function exportPdf() {
    const sectionsPdf = sections.map(sec => {
      const subtotal = sec.items.filter((e: any) => e.active).reduce((s: number, e: any) => s + Number(e.amount), 0);
      return {
        title: sec.cat,
        subtitle: `${sec.items.length} despesa(s) · Subtotal mensal ${fmt(subtotal)} · Período ${fmt(subtotal * months)}`,
        table: {
          headers: ["Nome", "Fornecedor", "Dia", "Valor mensal", "Total período"],
          align: ["left", "left", "center", "right", "right"] as ("left" | "right" | "center")[],
          rows: sec.items.map((e: any) => [e.name, e.vendor || "—", e.payment_day || "—", fmt(Number(e.amount)), fmt(Number(e.amount) * months)]),
          totalsRow: ["Subtotal", "", "", fmt(subtotal), fmt(subtotal * months)],
        },
      };
    });
    await generateBrandedPDF({
      title: "Despesas por Categoria",
      subtitle: "Despesas fixas recorrentes agrupadas por categoria",
      periodLabel: period.label,
      sections: [
        {
          kpis: [
            { label: "Total mensal", value: fmt(total), accent: "#ef4444" },
            { label: "Total no período", value: fmt(totalPeriod), accent: "#ef4444" },
            { label: "Categorias", value: String(sections.length) },
            { label: "Despesas ativas", value: String(expenses.filter((e: any) => e.active).length) },
          ],
        },
        ...sectionsPdf,
      ],
    });
    toast.success("PDF gerado");
  }

  return (
    <div className="space-y-6">
      <ExecHeader
        tag="Despesas Fixas"
        title="Custos Recorrentes"
        subtitle={`${period.label} · ${expenses.filter((e: any) => e.active).length} despesas ativas em ${sections.length} categorias`}
        kpis={[
          { label: "Total Mensal", value: formatBRL(total), highlight: true, positive: false },
          { label: "Total no Período", value: formatBRL(totalPeriod) },
          { label: "Categorias", value: String(sections.length) },
          { label: "Despesas Ativas", value: String(expenses.filter((e: any) => e.active).length) },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
            <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button>
          </>
        }
      />

      {sections.length === 0 && (
        <ExecCard><p className="text-center text-muted-foreground py-12">Nenhuma despesa cadastrada</p></ExecCard>
      )}

      {sections.map(section => {
        const subtotal = section.items.filter((e: any) => e.active).reduce((s: number, e: any) => s + Number(e.amount), 0);
        return (
          <ExecCard
            key={section.cat}
            title={section.cat}
            subtitle={`${section.items.length} ${section.items.length === 1 ? "despesa" : "despesas"}`}
            actions={<span className="text-base font-medium tabular-nums text-foreground">{formatBRL(subtotal)}</span>}
            padded={false}
          >
            <div className="border-t border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent bg-muted/20">
                    <TableHead className="h-11 px-5 lg:px-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Nome</TableHead>
                    <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Fornecedor</TableHead>
                    <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Valor</TableHead>
                    <TableHead className="h-11 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Dia</TableHead>
                    <TableHead className="h-11 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ativa</TableHead>
                    <TableHead className="h-11 w-16 px-5 lg:px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((e: any) => (
                    <TableRow
                      key={e.id}
                      className="border-border/50 cursor-pointer transition-colors hover:bg-foreground/[0.025]"
                      onClick={() => openEdit(e)}
                    >
                      <TableCell className="py-4 px-5 lg:px-6 font-medium text-foreground">{e.name}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{e.vendor || "—"}</TableCell>
                      <TableCell className="py-4 text-right tabular-nums font-medium text-foreground">{formatBRL(Number(e.amount))}</TableCell>
                      <TableCell className="py-4 text-center tabular-nums text-muted-foreground">{e.payment_day}</TableCell>
                      <TableCell className="py-4 text-center" onClick={ev => ev.stopPropagation()}>
                        <Switch checked={e.active} onCheckedChange={() => toggle(e)} />
                      </TableCell>
                      <TableCell className="py-4 px-5 lg:px-6 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(ev) => { ev.stopPropagation(); remove(e.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ExecCard>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{form.id ? "Editar" : "Nova"} Despesa Fixa</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fornecedor</Label><Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Dia Pgto</Label><Input type="number" min="1" max="31" value={form.payment_day} onChange={e => setForm({ ...form, payment_day: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Despesa Ativa</Label><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /></div>
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
