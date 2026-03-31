import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Package, ArrowUpRight, Loader2, Plus, MoreVertical, Pencil, Trash2, BookmarkPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
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

  const saveAsTemplate = async (client: any) => {
    if (!user) return;
    // Find latest briefing for this client
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground font-light">{clients.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-2">
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
    </div>
  );
}