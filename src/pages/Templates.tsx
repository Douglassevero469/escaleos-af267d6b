import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Plus, Copy, Trash2, Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("templates").insert({
        name: form.name,
        description: form.description || null,
        user_id: user.id,
        briefing_data: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["stats-templates"] });
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      toast({ title: "Template criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editTemplate) return;
      const { error } = await supabase.from("templates").update({
        name: form.name,
        description: form.description || null,
      }).eq("id", editTemplate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setEditTemplate(null);
      setForm({ name: "", description: "" });
      toast({ title: "Template atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["stats-templates"] });
      toast({ title: "Template excluído" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const useMutation2 = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from("templates").update({
        usage_count: (templates.find((t: any) => t.id === templateId)?.usage_count ?? 0) + 1,
      }).eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: (_data, templateId) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate(`/briefing/novo?template=${templateId}`);
    },
  });

  const openEdit = (t: any) => {
    setForm({ name: t.name, description: t.description || "" });
    setEditTemplate(t);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground font-light">{templates.length} templates disponíveis</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 btn-primary-glow"><Plus className="h-4 w-4" /> Novo Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Template Academia" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o template..." className="min-h-[80px]" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="w-full btn-primary-glow">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum template criado ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie templates para reutilizar briefings</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <GlassCard key={t.id} className="hover-scale space-y-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">{t.usage_count} usos</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(t)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir template?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(t.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.description || "Sem descrição"}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => useMutation2.mutate(t.id)}>
                <Copy className="h-3 w-3" /> Usar Template
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={() => { setEditTemplate(null); setForm({ name: "", description: "" }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Template</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[80px]" />
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={!form.name || updateMutation.isPending} className="w-full btn-primary-glow">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
