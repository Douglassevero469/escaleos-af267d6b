import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ClipboardList, Plus, Copy, Trash2, Loader2, Edit2, ExternalLink, MoreVertical, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import SubmissionsDialog from "@/components/forms/SubmissionsDialog";

const LAYOUT_LABELS: Record<string, string> = {
  list: "Lista",
  card: "Cartão",
  inline: "Corrido",
  stepper: "Multi-step",
  chat: "Chat Mode",
};

function generateSlug() {
  return Math.random().toString(36).substring(2, 10);
}

export default function Forms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", layout: "list" });
  const [viewSubmissions, setViewSubmissions] = useState<{ id: string; name: string } | null>(null);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get submission counts
  const { data: submissionCounts = {} } = useQuery({
    queryKey: ["form-submission-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("form_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((s: any) => {
        counts[s.form_id] = (counts[s.form_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("forms").insert({
        user_id: user.id,
        name: form.name,
        description: form.description || null,
        layout: form.layout,
        slug: generateSlug(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      setCreateOpen(false);
      setForm({ name: "", description: "", layout: "list" });
      toast({ title: "Formulário criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      setDeleteId(null);
      toast({ title: "Formulário excluído" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("forms").insert({
        user_id: user.id,
        name: formData.name + " (cópia)",
        description: formData.description,
        layout: formData.layout,
        fields: formData.fields,
        settings: formData.settings,
        slug: generateSlug(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast({ title: "Formulário duplicado!" });
    },
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formulários</h1>
          <p className="text-muted-foreground text-sm">Crie formulários de captura de leads</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Formulário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : forms.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum formulário criado</h3>
          <p className="text-muted-foreground text-sm mb-4">Crie seu primeiro formulário de captura</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar Formulário
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((f: any) => (
            <GlassCard key={f.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{f.name}</h3>
                  {f.description && <p className="text-xs text-muted-foreground truncate">{f.description}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/forms/${f.id}`)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(f)}>
                      <Copy className="h-4 w-4 mr-2" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyLink(f.slug)}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Copiar Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteId(f.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={f.status === "published" ? "default" : "secondary"}>
                  {f.status === "published" ? "Publicado" : "Rascunho"}
                </Badge>
                <Badge variant="outline">{LAYOUT_LABELS[f.layout] || f.layout}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {(submissionCounts as any)[f.id] || 0} respostas
                </span>
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/forms/${f.id}`)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyLink(f.slug)}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Formulário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Captação de Leads" />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descrição do formulário" />
            </div>
            <div>
              <Label>Layout</Label>
              <Select value={form.layout} onValueChange={v => setForm(p => ({ ...p, layout: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista (vertical)</SelectItem>
                  <SelectItem value="card">Cartão (por campo)</SelectItem>
                  <SelectItem value="inline">Corrido (grid)</SelectItem>
                  <SelectItem value="stepper">Multi-step (wizard)</SelectItem>
                  <SelectItem value="chat">Chat Mode (conversação)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending} className="w-full">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar Formulário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as respostas serão perdidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
