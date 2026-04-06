import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Package, ArrowUpRight, Loader2, Plus, MoreVertical, Pencil, Trash2, BookmarkPlus, Clock, CheckCircle, XCircle, Link2, Copy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DOC_TYPES = ["planejamento", "concorrentes", "funil", "midia", "criativos", "playbook", "script", "objecoes", "landing_page", "followup", "calendario_editorial", "email_marketing"] as const;
const DOC_TITLES: Record<string, string> = {
  planejamento: "Planejamento Estratégico",
  concorrentes: "Análise de Concorrentes",
  funil: "Funil de Vendas",
  midia: "Plano de Mídia",
  criativos: "Criativos Prontos",
  playbook: "Playbook Comercial",
  script: "Script de Vendas",
  objecoes: "Tabela de Objeções",
  landing_page: "Landing Page de Alta Conversão",
  followup: "Cadência de Mensagens Follow-up",
  calendario_editorial: "Calendário Editorial de Conteúdo",
  email_marketing: "Estratégia de Email Marketing",
};

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [rejectConfirm, setRejectConfirm] = useState<any>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", nicho: "", instagram: "", site: "" });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, packages(id, briefing_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pendingBriefings = [] } = useQuery({
    queryKey: ["pending-briefings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("briefings")
        .select("*, clients(name, nicho)")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createClient = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("clients").insert({
        name: form.name,
        nicho: form.nicho || null,
        instagram: form.instagram || null,
        site: form.site || null,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["stats-clients"] });
      setOpen(false);
      setForm({ name: "", nicho: "", instagram: "", site: "" });
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro ao criar cliente", description: e.message, variant: "destructive" }),
  });

  const updateClient = useMutation({
    mutationFn: async () => {
      if (!editClient) return;
      const { error } = await supabase.from("clients").update({
        name: form.name,
        nicho: form.nicho || null,
        instagram: form.instagram || null,
        site: form.site || null,
      }).eq("id", editClient.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditOpen(false);
      setEditClient(null);
      toast({ title: "Cliente atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["stats-clients"] });
      toast({ title: "Cliente excluído!" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const approveBriefing = async (briefing: any) => {
    if (!user) return;
    try {
      // Update briefing status
      await supabase.from("briefings").update({ status: "completed" } as any).eq("id", briefing.id);

      // Create package
      const { data: pkg, error: pkgErr } = await supabase
        .from("packages")
        .insert({ briefing_id: briefing.id, client_id: briefing.client_id, user_id: user.id, status: "generating" })
        .select("id")
        .single();
      if (pkgErr) throw pkgErr;

      // Create document placeholders
      const docInserts = DOC_TYPES.map(docType => ({
        package_id: pkg.id,
        user_id: user.id,
        doc_type: docType,
        title: DOC_TITLES[docType],
        status: "pending",
        content: null,
      }));
      await supabase.from("documents").insert(docInserts);

      queryClient.invalidateQueries({ queryKey: ["pending-briefings"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Briefing aprovado!", description: "Pacote criado e documentos sendo gerados." });
      navigate(`/pacote/${pkg.id}`);
    } catch (e: any) {
      toast({ title: "Erro ao aprovar", description: e.message, variant: "destructive" });
    }
  };

  const rejectBriefing = async (briefing: any) => {
    await supabase.from("briefings").update({ status: "rejected" } as any).eq("id", briefing.id);
    queryClient.invalidateQueries({ queryKey: ["pending-briefings"] });
    setRejectConfirm(null);
    toast({ title: "Briefing rejeitado" });
  };

  const saveAsTemplate = async (client: any) => {
    if (!user) return;
    const latestPkg = client.packages?.sort((a: any, b: any) => b.id.localeCompare(a.id))[0];
    if (!latestPkg?.briefing_id) {
      toast({ title: "Sem briefing", description: "Este cliente não possui briefing para salvar como template.", variant: "destructive" });
      return;
    }
    const { data: briefing } = await supabase.from("briefings").select("data").eq("id", latestPkg.briefing_id).maybeSingle();
    if (!briefing?.data) {
      toast({ title: "Briefing vazio", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("templates").insert({
      user_id: user.id,
      name: `Template — ${client.name}`,
      description: `Baseado no briefing de ${client.name}`,
      briefing_data: briefing.data,
    });
    if (error) {
      toast({ title: "Erro ao salvar template", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template salvo!", description: `Template criado a partir de ${client.name}` });
      queryClient.invalidateQueries({ queryKey: ["stats-templates"] });
    }
  };

  const openEdit = (client: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditClient(client);
    setForm({ name: client.name, nicho: client.nicho || "", instagram: client.instagram || "", site: client.site || "" });
    setEditOpen(true);
  };

  const filtered = clients.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.nicho ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.hostname.includes("preview") ? "https://escaleos.lovable.app" : window.location.origin}/briefing-publico`
    : "/briefing-publico";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground font-light">{clients.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setLinkDialogOpen(true)}>
            <Link2 className="h-4 w-4" /> Link Público
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-2">
                  <Label>Nicho</Label>
                  <Input value={form.nicho} onChange={e => setForm(f => ({ ...f, nicho: e.target.value }))} placeholder="Ex: Academia, Estética..." />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@empresa" />
                </div>
                <div className="space-y-2">
                  <Label>Site</Label>
                  <Input value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} placeholder="https://..." />
                </div>
                <Button onClick={() => createClient.mutate()} disabled={!form.name || createClient.isPending} className="w-full btn-primary-glow">
                  {createClient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link to="/briefing/novo">
            <Button className="gap-2 btn-primary-glow font-semibold">Novo Briefing <ArrowUpRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue={pendingBriefings.length > 0 ? "pending" : "clients"} className="w-full">
        <TabsList>
          <TabsTrigger value="clients">Clientes ({clients.length})</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Aguardando Aprovação
            {pendingBriefings.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px]">
                {pendingBriefings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou nicho..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Crie um novo cliente ou envie um briefing</p>
            </GlassCard>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((client: any) => (
                <GlassCard key={client.id} className="hover-scale cursor-pointer space-y-3 relative group">
                  <Link to={`/clientes/${client.id}/pacotes`} className="absolute inset-0 z-0" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.nicho ?? "—"}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.preventDefault()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => openEdit(client, e)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveAsTemplate(client); }}>
                          <BookmarkPlus className="h-3.5 w-3.5 mr-2" /> Salvar como Template
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(client); }}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground relative z-10 pointer-events-none">
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {client.packages?.length ?? 0} pacotes</span>
                    <span>{new Date(client.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingBriefings.length === 0 ? (
            <GlassCard className="text-center py-12">
              <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum briefing pendente</p>
              <p className="text-xs text-muted-foreground mt-1">Compartilhe o link público para receber novos briefings</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {pendingBriefings.map((b: any) => {
                const bd = b.data as any;
                return (
                  <GlassCard key={b.id} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-semibold">{bd?.nomeEmpresa || (b as any).clients?.name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">
                            {bd?.nichoAtuacao || (b as any).clients?.nicho || "—"} · Enviado em {new Date(b.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5">
                        Aguardando
                      </Badge>
                    </div>

                    {/* Summary of briefing data */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {bd?.faturamentoAtual && <div className="bg-muted/30 rounded-md px-3 py-2"><span className="text-muted-foreground">Faturamento:</span> <span className="font-medium">{bd.faturamentoAtual}</span></div>}
                      {bd?.metaFaturamento && <div className="bg-muted/30 rounded-md px-3 py-2"><span className="text-muted-foreground">Meta:</span> <span className="font-medium">{bd.metaFaturamento}</span></div>}
                      {bd?.ticketMedio && <div className="bg-muted/30 rounded-md px-3 py-2"><span className="text-muted-foreground">Ticket:</span> <span className="font-medium">{bd.ticketMedio}</span></div>}
                      {bd?.nomeProduto && <div className="bg-muted/30 rounded-md px-3 py-2"><span className="text-muted-foreground">Produto:</span> <span className="font-medium">{bd.nomeProduto}</span></div>}
                      {bd?.regiaoAtuacao && <div className="bg-muted/30 rounded-md px-3 py-2"><span className="text-muted-foreground">Região:</span> <span className="font-medium">{bd.regiaoAtuacao}</span></div>}
                      {bd?.gargalo && <div className="bg-muted/30 rounded-md px-3 py-2"><span className="text-muted-foreground">Gargalo:</span> <span className="font-medium truncate">{bd.gargalo}</span></div>}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => setRejectConfirm(b)}>
                        <XCircle className="h-3.5 w-3.5" /> Rejeitar
                      </Button>
                      <Button size="sm" className="gap-1" onClick={() => approveBriefing(b)}>
                        <CheckCircle className="h-3.5 w-3.5" /> Aprovar e Gerar Pacote
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Public Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link Público do Briefing</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Envie este link para seus clientes preencherem o briefing diretamente. Após o preenchimento, o briefing aparecerá na aba "Aguardando Aprovação".</p>
            <div className="flex gap-2">
              <Input value={publicUrl} readOnly className="bg-muted/50 text-sm" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>📋 O cliente preenche o formulário de 7 etapas</p>
              <p>🔔 Você recebe uma notificação quando um novo briefing chegar</p>
              <p>✅ Aprove para gerar automaticamente os 12 documentos</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nicho</Label>
              <Input value={form.nicho} onChange={e => setForm(f => ({ ...f, nicho: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Input value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} />
            </div>
            <Button onClick={() => updateClient.mutate()} disabled={!form.name || updateClient.isPending} className="w-full btn-primary-glow">
              {updateClient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita e todos os pacotes associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { deleteClient.mutate(deleteConfirm.id); setDeleteConfirm(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={!!rejectConfirm} onOpenChange={(open) => !open && setRejectConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar briefing</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar o briefing de <strong>{(rejectConfirm?.data as any)?.nomeEmpresa}</strong>? O briefing não será processado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => rejectBriefing(rejectConfirm)}>
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
