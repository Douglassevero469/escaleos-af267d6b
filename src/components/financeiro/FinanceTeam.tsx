import { useState, useMemo } from "react";
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
import { Plus, Trash2, LayoutGrid, List, Download } from "lucide-react";
import { formatBRL, COMPENSATION_LABELS, STATUS_BADGE } from "@/lib/finance-utils";
import { Period, monthsInPeriod } from "@/components/financeiro/PeriodFilter";
import { downloadCSV, generateBrandedPDF, fmt } from "@/lib/finance-export";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MemberForm {
  id?: string;
  name: string;
  role: string;
  manager_id: string | null;
  compensation_type: string;
  monthly_cost: number;
  status: string;
  start_date: string;
  notes: string;
}

const empty: MemberForm = {
  name: "", role: "", manager_id: null, compensation_type: "salary",
  monthly_cost: 0, status: "active", start_date: "", notes: "",
};

interface Props { period: Period }

export function FinanceTeam({ period }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [view, setView] = useState<"org" | "table">("org");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(empty);

  const { data: teamAll = [] } = useQuery({
    queryKey: ["fin-team-list"],
    queryFn: async () => (await supabase.from("finance_team_members").select("*").order("created_at")).data || [],
  });

  // Membros vigentes no período (admitidos até o fim do período)
  const team = teamAll.filter((t: any) => !t.start_date || t.start_date <= period.end);
  const months = monthsInPeriod(period);

  const managers = team.filter((t: any) => !t.manager_id);
  const subordinates = (mgrId: string) => team.filter((t: any) => t.manager_id === mgrId);

  const totalSalary = team.filter((t: any) => t.compensation_type === "salary" && t.status === "active").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);
  const totalProlabore = team.filter((t: any) => t.compensation_type === "prolabore" && t.status === "active").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);
  const totalContractor = team.filter((t: any) => t.compensation_type === "contractor" && t.status === "active").reduce((s: number, t: any) => s + Number(t.monthly_cost), 0);
  const totalAll = totalSalary + totalProlabore + totalContractor;
  const totalPeriod = totalAll * months;
  const vacant = team.filter((t: any) => t.status === "vacant").length;

  async function save() {
    if (!form.role) return toast.error("Informe o cargo");
    const payload = {
      user_id: user!.id,
      name: form.name || null,
      role: form.role,
      manager_id: form.manager_id || null,
      compensation_type: form.compensation_type,
      monthly_cost: Number(form.monthly_cost),
      status: form.status,
      start_date: form.start_date || null,
      notes: form.notes,
    };
    const { error } = form.id
      ? await supabase.from("finance_team_members").update(payload).eq("id", form.id)
      : await supabase.from("finance_team_members").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Posição salva");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["fin-team-list"] });
    qc.invalidateQueries({ queryKey: ["fin-team"] });
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "Excluir posição?", description: "Este membro da equipe será removido permanentemente. Esta ação não poderá ser desfeita.", confirmText: "Excluir" }))) return;
    await supabase.from("finance_team_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["fin-team-list"] });
    qc.invalidateQueries({ queryKey: ["fin-team"] });
  }

  function openEdit(m: any) {
    setForm({
      id: m.id, name: m.name || "", role: m.role,
      manager_id: m.manager_id, compensation_type: m.compensation_type,
      monthly_cost: Number(m.monthly_cost), status: m.status,
      start_date: m.start_date || "", notes: m.notes || "",
    });
    setOpen(true);
  }

  function exportCsv() {
    const headers = ["Cargo", "Nome", "Tipo", "Status", "Custo mensal", "Início", "Custo no período"];
    const rows = team.map((t: any) => [
      t.role, t.name || "Vaga aberta",
      COMPENSATION_LABELS[t.compensation_type] || t.compensation_type,
      t.status, Number(t.monthly_cost).toFixed(2), t.start_date || "",
      (Number(t.monthly_cost) * months).toFixed(2),
    ]);
    downloadCSV(`equipe-${period.start}-a-${period.end}`, headers, rows);
    toast.success("CSV exportado");
  }

  async function exportPdf() {
    await generateBrandedPDF({
      title: "Equipe & Folha de Pagamento",
      subtitle: "Composição de equipe, custos e vagas em aberto",
      periodLabel: period.label,
      sections: [
        {
          kpis: [
            { label: "Folha CLT", value: fmt(totalSalary) },
            { label: "Pró-labores", value: fmt(totalProlabore) },
            { label: "PJ / Freelas", value: fmt(totalContractor) },
            { label: "Total mensal", value: fmt(totalAll), accent: "#7B2FF7" },
            { label: "Total no período", value: fmt(totalPeriod), accent: "#0000FF" },
            { label: "Vagas abertas", value: String(vacant), accent: "#ef4444" },
          ],
          table: {
            headers: ["Cargo", "Nome", "Tipo", "Status", "Custo mensal", "Custo período"],
            align: ["left", "left", "left", "center", "right", "right"],
            rows: team.map((t: any) => [
              t.role, t.name || "— Vaga aberta —",
              COMPENSATION_LABELS[t.compensation_type] || t.compensation_type,
              t.status, fmt(Number(t.monthly_cost)), fmt(Number(t.monthly_cost) * months),
            ]),
            totalsRow: ["TOTAL", "", "", "", fmt(totalAll), fmt(totalPeriod)],
          },
        },
      ],
    });
    toast.success("PDF gerado");
  }

  const memberCard = (m: any) => {
    const filled = m.status === "active" && m.name;
    return (
      <button
        key={m.id}
        onClick={() => openEdit(m)}
        className={cn(
          "rounded-lg border-2 px-3 py-2 text-left text-xs transition hover:scale-105 min-w-[120px]",
          filled ? "bg-lime-200/80 border-lime-400 text-lime-900 dark:bg-lime-500/20 dark:text-lime-200" :
            "bg-rose-200/70 border-rose-400 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200"
        )}
      >
        <div className="font-bold leading-tight">{m.role}</div>
        <div className="text-[10px] opacity-80 mt-0.5">{m.name || "Vaga aberta"}</div>
        <div className="text-[10px] font-mono mt-1">{formatBRL(Number(m.monthly_cost))}</div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <ExecHeader
        tag="Equipe & Folha"
        title="Estrutura Operacional"
        subtitle={`${period.label} · ${team.filter((t: any) => t.status === "active").length} ativos · ${vacant} vagas abertas`}
        kpis={[
          { label: "Custo Mensal", value: formatBRL(totalAll), highlight: true, positive: true },
          { label: "Folha CLT", value: formatBRL(totalSalary) },
          { label: "Pró-labores", value: formatBRL(totalProlabore) },
          { label: "PJ / Freela", value: formatBRL(totalContractor) },
        ]}
        actions={
          <>
            <div className="inline-flex rounded-lg border border-border bg-card/50 p-1">
              <Button variant={view === "org" ? "default" : "ghost"} size="sm" onClick={() => setView("org")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={view === "table" ? "default" : "ghost"} size="sm" onClick={() => setView("table")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>
            <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova Posição</Button>
          </>
        }
      />

      {view === "org" && (
        <ExecCard title="Organograma" subtitle={`Total no período: ${formatBRL(totalPeriod)}`}>
          <div className="overflow-x-auto">
          {team.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Cadastre membros para visualizar o organograma</p>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="rounded-lg bg-primary/10 border-2 border-primary px-6 py-2 font-bold text-primary">EQUIPE</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {managers.map((mgr: any) => (
                  <div key={mgr.id} className="space-y-3">
                    <div className="flex justify-center">{memberCard(mgr)}</div>
                    <div className="border-l-2 border-dashed border-border pl-3 ml-[60px] space-y-2">
                      {subordinates(mgr.id).map(memberCard)}
                    </div>
                  </div>
                ))}
              </div>
              {team.filter((t: any) => t.manager_id && !managers.find((m: any) => m.id === t.manager_id)).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Outros</p>
                  <div className="flex flex-wrap gap-2">
                    {team.filter((t: any) => t.manager_id && !managers.find((m: any) => m.id === t.manager_id)).map(memberCard)}
                  </div>
                </div>
              )}
              <div className="flex justify-center pt-4 border-t border-border">
                <div className="rounded-lg bg-muted px-6 py-2 font-mono font-bold">{formatBRL(totalAll)}</div>
              </div>
            </div>
          )}
          </div>
        </ExecCard>
      )}

      {view === "table" && (
        <ExecCard title="Membros da Equipe" padded={false}>
          <div className="border-t border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent bg-muted/20">
                  <TableHead className="h-11 px-5 lg:px-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Nome</TableHead>
                  <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Cargo</TableHead>
                  <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Gestor</TableHead>
                  <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Tipo</TableHead>
                  <TableHead className="h-11 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Custo</TableHead>
                  <TableHead className="h-11 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Status</TableHead>
                  <TableHead className="h-11 w-16 px-5 lg:px-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.length === 0 && (
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Nenhum membro cadastrado</TableCell>
                  </TableRow>
                )}
                {team.map((m: any) => {
                  const mgr = team.find((t: any) => t.id === m.manager_id);
                  return (
                    <TableRow
                      key={m.id}
                      className="border-border/50 cursor-pointer transition-colors hover:bg-foreground/[0.025]"
                      onClick={() => openEdit(m)}
                    >
                      <TableCell className="py-4 px-5 lg:px-6 font-medium text-foreground">
                        {m.name || <span className="text-muted-foreground italic font-normal">Vaga aberta</span>}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{m.role || "—"}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{mgr?.name || mgr?.role || "—"}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{COMPENSATION_LABELS[m.compensation_type]}</TableCell>
                      <TableCell className="py-4 text-right tabular-nums font-medium text-foreground">{formatBRL(Number(m.monthly_cost))}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`${STATUS_BADGE[m.status]} font-medium capitalize border-0`}>
                          {m.status === "active" ? "Ativo" : m.status === "inactive" ? "Inativo" : m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-5 lg:px-6 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ExecCard>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{form.id ? "Editar" : "Nova"} Posição</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Nome (deixe vazio para vaga em aberto)</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Cargo *</Label><Input placeholder="Ex: Closer/SDR, Diretor de Arte..." value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
            <div>
              <Label>Gestor (sócio)</Label>
              <Select value={form.manager_id || "none"} onValueChange={v => setForm({ ...form, manager_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem gestor (sócio)</SelectItem>
                  {team.filter((t: any) => !t.manager_id && t.id !== form.id).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name || t.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de remuneração</Label>
              <Select value={form.compensation_type} onValueChange={v => setForm({ ...form, compensation_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salário CLT</SelectItem>
                  <SelectItem value="prolabore">Pró-labore</SelectItem>
                  <SelectItem value="contractor">PJ / Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Custo mensal (R$)</Label><Input type="number" step="0.01" value={form.monthly_cost} onChange={e => setForm({ ...form, monthly_cost: Number(e.target.value) })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="vacant">Vaga aberta</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Início</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
