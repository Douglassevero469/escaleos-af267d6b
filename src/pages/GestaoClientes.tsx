import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase, Plus, Loader2, Search, MoreVertical, Pencil, Trash2,
  Pause, Play, X, ExternalLink, Download, DollarSign, Users, TrendingDown, Activity,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const SERVICE_SUGGESTIONS = [
  "Tráfego Pago", "Social Media", "Full Service", "Consultoria",
  "Software", "Escale CRM", "SEO", "Closer / Vendas", "Branding",
  "Email Marketing", "Conteúdo", "Landing Page",
];

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  churned: "Churn",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  paused: "bg-warning/10 text-warning border-warning/30",
  churned: "bg-destructive/10 text-destructive border-destructive/30",
};

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const fmtDate = (d?: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface ContractForm {
  client_id: string;
  status: string;
  monthly_fee: string;
  start_date: string;
  renewal_date: string;
  payment_day: string;
  responsible: string;
  notes: string;
}

const emptyForm: ContractForm = {
  client_id: "", status: "active", monthly_fee: "", start_date: "",
  renewal_date: "", payment_day: "", responsible: "", notes: "",
};

export default function GestaoClientes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [newService, setNewService] = useState({ service_type: "", description: "", scope: "" });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name, nicho").order("name");
      return data ?? [];
    },
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["client-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_contracts")
        .select("*, clients(id, name, nicho), client_services(id, service_type, description, scope, active)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const detail = useMemo(
    () => contracts.find((c: any) => c.id === detailId) ?? null,
    [contracts, detailId]
  );

  const upsertContract = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const payload: any = {
        client_id: form.client_id,
        status: form.status,
        monthly_fee: parseFloat(form.monthly_fee || "0") || 0,
        start_date: form.start_date || null,
        renewal_date: form.renewal_date || null,
        payment_day: form.payment_day ? parseInt(form.payment_day) : null,
        responsible: form.responsible || null,
        notes: form.notes || "",
        user_id: user.id,
      };
      if (editingId) {
        const { error } = await supabase.from("client_contracts").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_contracts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-contracts"] });
      setOpenNew(false);
      setForm(emptyForm);
      setEditingId(null);
      toast({ title: editingId ? "Contrato atualizado" : "Contrato criado" });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("client_contracts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-contracts"] });
      toast({ title: "Status atualizado" });
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-contracts"] });
      setDetailId(null);
      toast({ title: "Contrato excluído" });
    },
  });

  const addService = useMutation({
    mutationFn: async () => {
      if (!user || !detailId) throw new Error("Falta dados");
      if (!newService.service_type) throw new Error("Selecione um serviço");
      const { error } = await supabase.from("client_services").insert({
        contract_id: detailId,
        user_id: user.id,
        service_type: newService.service_type,
        description: newService.description,
        scope: newService.scope,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-contracts"] });
      setNewService({ service_type: "", description: "", scope: "" });
      toast({ title: "Serviço adicionado" });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-contracts"] }),
  });

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      client_id: c.client_id,
      status: c.status,
      monthly_fee: String(c.monthly_fee ?? ""),
      start_date: c.start_date ?? "",
      renewal_date: c.renewal_date ?? "",
      payment_day: c.payment_day ? String(c.payment_day) : "",
      responsible: c.responsible ?? "",
      notes: c.notes ?? "",
    });
    setOpenNew(true);
  };

  // KPIs
  const activeContracts = contracts.filter((c: any) => c.status === "active");
  const mrr = activeContracts.reduce((s: number, c: any) => s + Number(c.monthly_fee || 0), 0);
  const ticket = activeContracts.length ? mrr / activeContracts.length : 0;
  const churnedThisMonth = contracts.filter((c: any) => {
    if (c.status !== "churned") return false;
    const d = new Date(c.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Services list for filter
  const allServices = useMemo(() => {
    const s = new Set<string>();
    contracts.forEach((c: any) =>
      (c.client_services ?? []).forEach((sv: any) => sv.active && s.add(sv.service_type))
    );
    return Array.from(s).sort();
  }, [contracts]);

  const filtered = contracts.filter((c: any) => {
    const name = (c.clients?.name ?? "").toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (serviceFilter !== "all") {
      const has = (c.client_services ?? []).some(
        (s: any) => s.service_type === serviceFilter && s.active
      );
      if (!has) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const rows = [
      ["Cliente", "Status", "Fee Mensal", "Início", "Renovação", "Responsável", "Serviços"],
      ...filtered.map((c: any) => [
        c.clients?.name ?? "",
        STATUS_LABELS[c.status] ?? c.status,
        String(c.monthly_fee ?? 0).replace(".", ","),
        c.start_date ?? "",
        c.renewal_date ?? "",
        c.responsible ?? "",
        (c.client_services ?? []).filter((s: any) => s.active).map((s: any) => s.service_type).join(" | "),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-ativos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Clientes</h1>
          <p className="text-sm text-muted-foreground font-light">
            {activeContracts.length} contratos ativos · MRR {fmtBRL(mrr)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Dialog open={openNew} onOpenChange={(v) => { setOpenNew(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 btn-primary-glow font-semibold">
                <Plus className="h-4 w-4" /> Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 max-h-[70vh] overflow-auto pr-1">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="churned">Churn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Mensal (R$) *</Label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={form.monthly_fee}
                      onChange={e => setForm(f => ({ ...f, monthly_fee: e.target.value }))}
                      placeholder="3500.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Renovação</Label>
                    <Input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dia pgto.</Label>
                    <Input type="number" min="1" max="31" value={form.payment_day} onChange={e => setForm(f => ({ ...f, payment_day: e.target.value }))} placeholder="10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Responsável interno</Label>
                  <Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome do gestor" />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                </div>

                <Button
                  onClick={() => upsertContract.mutate()}
                  disabled={!form.client_id || !form.monthly_fee || upsertContract.isPending}
                  className="w-full btn-primary-glow"
                >
                  {upsertContract.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Salvar alterações" : "Criar Contrato"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</p>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{activeContracts.length}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">MRR</p>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold">{fmtBRL(mrr)}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{fmtBRL(ticket)}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Churn no mês</p>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold">{churnedThisMonth}</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="paused">Pausados</TabsTrigger>
            <TabsTrigger value="churned">Churn</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Serviço" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os serviços</SelectItem>
            {allServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum contrato encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Crie um novo contrato para começar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead>Fee Mensal</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Renovação</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => {
                const services = (c.client_services ?? []).filter((s: any) => s.active);
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailId(c.id)}>
                    <TableCell>
                      <div className="font-medium text-sm">{c.clients?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{c.clients?.nicho ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {services.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {services.slice(0, 3).map((s: any) => (
                          <Badge key={s.id} variant="secondary" className="text-[10px]">{s.service_type}</Badge>
                        ))}
                        {services.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{services.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{fmtBRL(Number(c.monthly_fee || 0))}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.start_date)}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.renewal_date)}</TableCell>
                    <TableCell className="text-sm">{c.responsible ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[c.status]}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          {c.status !== "active" && (
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: c.id, status: "active" })}>
                              <Play className="h-3.5 w-3.5 mr-2" /> Marcar como Ativo
                            </DropdownMenuItem>
                          )}
                          {c.status !== "paused" && (
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: c.id, status: "paused" })}>
                              <Pause className="h-3.5 w-3.5 mr-2" /> Pausar
                            </DropdownMenuItem>
                          )}
                          {c.status !== "churned" && (
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: c.id, status: "churned" })}>
                              <X className="h-3.5 w-3.5 mr-2" /> Marcar Churn
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteContract.mutate(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      {/* Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span>{detail.clients?.name}</span>
                  <Badge variant="outline" className={STATUS_STYLES[detail.status]}>
                    {STATUS_LABELS[detail.status]}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fee Mensal</p>
                    <p className="font-bold text-lg">{fmtBRL(Number(detail.monthly_fee || 0))}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dia Pagamento</p>
                    <p className="font-bold text-lg">{detail.payment_day ?? "—"}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Início</p>
                    <p className="font-medium">{fmtDate(detail.start_date)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Renovação</p>
                    <p className="font-medium">{fmtDate(detail.renewal_date)}</p>
                  </div>
                </div>

                {detail.responsible && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Responsável interno</p>
                    <p className="text-sm font-medium">{detail.responsible}</p>
                  </div>
                )}

                {detail.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{detail.notes}</p>
                  </div>
                )}

                {/* Services */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Serviços prestados</h3>
                    <span className="text-xs text-muted-foreground">
                      {(detail.client_services ?? []).filter((s: any) => s.active).length} ativos
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(detail.client_services ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum serviço cadastrado</p>
                    )}
                    {(detail.client_services ?? []).map((s: any) => (
                      <div key={s.id} className="flex items-start justify-between gap-2 bg-muted/20 rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{s.service_type}</p>
                          {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                          {s.scope && <p className="text-xs mt-1 italic">Escopo: {s.scope}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeService.mutate(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add service */}
                  <div className="border border-border/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium">Adicionar serviço</p>
                    <Select value={newService.service_type} onValueChange={(v) => setNewService(s => ({ ...s, service_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Tipo de serviço" /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_SUGGESTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Descrição (opcional)"
                      value={newService.description}
                      onChange={e => setNewService(s => ({ ...s, description: e.target.value }))}
                    />
                    <Input
                      placeholder="Escopo / entregáveis (opcional)"
                      value={newService.scope}
                      onChange={e => setNewService(s => ({ ...s, scope: e.target.value }))}
                    />
                    <Button
                      size="sm" className="w-full"
                      onClick={() => addService.mutate()}
                      disabled={!newService.service_type || addService.isPending}
                    >
                      {addService.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Plus className="h-3.5 w-3.5 mr-2" />}
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(detail)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                  </Button>
                  <Link to={`/clientes/${detail.client_id}/pacotes`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" /> Ver Pacotes
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
