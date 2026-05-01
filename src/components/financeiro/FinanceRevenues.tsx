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
import { Plus, Download, Trash2, Search } from "lucide-react";
import { formatBRL, STATUS_BADGE, REVENUE_CATEGORIES } from "@/lib/finance-utils";
import { Period, monthsInPeriod } from "@/components/financeiro/PeriodFilter";
import { downloadCSV, generateBrandedPDF, fmt } from "@/lib/finance-export";
import { toast } from "sonner";

interface RevForm {
  id?: string;
  client_name: string;
  description: string;
  amount: number;
  payment_day: number;
  status: string;
  start_date: string;
  category: string;
}

const empty: RevForm = {
  client_name: "", description: "", amount: 0, payment_day: 5,
  status: "active", start_date: new Date().toISOString().slice(0, 10), category: "Tráfego Pago",
};

interface Props { period: Period }

export function FinanceRevenues({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RevForm>(empty);

  const { data: revenues = [] } = useQuery({
    queryKey: ["fin-revenues"],
    queryFn: async () => (await supabase.from("finance_recurring_revenues").select("*").order("amount", { ascending: false })).data || [],
  });

  // Ativas no período: começou antes/durante o fim do período E (sem fim ou fim >= início)
  const activeInPeriod = revenues.filter((r: any) =>
    (!r.start_date || r.start_date <= period.end) &&
    (!r.end_date || r.end_date >= period.start)
  );

  const filtered = activeInPeriod.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.client_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const months = monthsInPeriod(period);
  const mrr = activeInPeriod.filter((r: any) => r.status === "active").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalPeriod = mrr * months;

  async function save() {
    if (!form.client_name) return toast.error("Informe o nome do cliente");
    const payload = {
      user_id: user!.id,
      client_name: form.client_name,
      description: form.description,
      amount: Number(form.amount),
      payment_day: Number(form.payment_day),
      status: form.status,
      start_date: form.start_date || null,
    };
    const { error } = form.id
      ? await supabase.from("finance_recurring_revenues").update(payload).eq("id", form.id)
      : await supabase.from("finance_recurring_revenues").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Receita salva");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["fin-revenues"] });
    qc.invalidateQueries({ queryKey: ["fin-rev"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta receita?")) return;
    await supabase.from("finance_recurring_revenues").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["fin-revenues"] });
    qc.invalidateQueries({ queryKey: ["fin-rev"] });
    toast.success("Removido");
  }

  async function importContracts() {
    const { data: contracts } = await supabase.from("client_contracts").select("*").eq("status", "active");
    if (!contracts?.length) return toast.error("Nenhum contrato ativo encontrado");
    const existing = new Set(revenues.map((r: any) => r.linked_contract_id).filter(Boolean));
    const toInsert = contracts.filter((c: any) => !existing.has(c.id)).map((c: any) => ({
      user_id: user!.id,
      client_name: c.client_name || "Cliente",
      description: c.notes || "",
      amount: Number(c.monthly_fee),
      payment_day: c.payment_day || 5,
      status: "active",
      start_date: c.start_date,
      linked_contract_id: c.id,
    }));
    if (!toInsert.length) return toast.info("Todos os contratos já estão importados");
    const { error } = await supabase.from("finance_recurring_revenues").insert(toInsert);
    if (error) return toast.error(error.message);
    toast.success(`${toInsert.length} contratos importados`);
    qc.invalidateQueries({ queryKey: ["fin-revenues"] });
  }

  function exportCsv() {
    const headers = ["Cliente", "Descrição", "Valor mensal", "Dia pgto", "Status", "Início", "Total no período"];
    const rows = filtered.map((r: any) => [r.client_name, r.description || "", Number(r.amount).toFixed(2), r.payment_day || "", r.status, r.start_date || "", (Number(r.amount) * months).toFixed(2)]);
    downloadCSV(`receitas-${period.start}-a-${period.end}`, headers, rows);
    toast.success("CSV exportado");
  }

  async function exportPdf() {
    const totalFiltered = filtered.reduce((s: number, r: any) => s + Number(r.amount), 0);
    await generateBrandedPDF({
      title: "Receitas Recorrentes",
      subtitle: "Carteira de clientes ativos no período",
      periodLabel: period.label,
      sections: [
        {
          kpis: [
            { label: "MRR", value: fmt(mrr), accent: "#22c55e" },
            { label: "Total no período", value: fmt(totalPeriod), accent: "#22c55e" },
            { label: "Clientes", value: String(filtered.length) },
            { label: "Ticket médio", value: fmt(filtered.length ? totalFiltered / filtered.length : 0) },
          ],
          table: {
            headers: ["Cliente", "Valor mensal", "Dia", "Status", "Total período"],
            align: ["left", "right", "center", "center", "right"],
            rows: filtered.map((r: any) => [r.client_name, fmt(Number(r.amount)), r.payment_day || "—", r.status, fmt(Number(r.amount) * months)]),
            totalsRow: ["TOTAL", fmt(totalFiltered), "", "", fmt(totalFiltered * months)],
          },
        },
      ],
    });
    toast.success("PDF gerado");
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">MRR · {period.label}</p>
            <p className="text-3xl font-bold">{formatBRL(mrr)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filtered.length} receitas · Total no período: <span className="font-mono text-foreground">{formatBRL(totalPeriod)}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={importContracts}>Importar de Contratos</Button>
            <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
            <Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova Receita</Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="churned">Churn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Dia Pgto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma receita</TableCell></TableRow>
            )}
            {filtered.map((r: any) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => { setForm({ ...r, category: "Tráfego Pago" }); setOpen(true); }}>
                <TableCell className="font-medium">{r.client_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.description}</TableCell>
                <TableCell className="text-right font-mono">{formatBRL(Number(r.amount))}</TableCell>
                <TableCell className="text-center">{r.payment_day}</TableCell>
                <TableCell><Badge variant="outline" className={STATUS_BADGE[r.status]}>{r.status}</Badge></TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); remove(r.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{form.id ? "Editar" : "Nova"} Receita</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Cliente *</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Dia Pgto</Label><Input type="number" min="1" max="31" value={form.payment_day} onChange={e => setForm({ ...form, payment_day: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REVENUE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="churned">Churn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data de início</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
