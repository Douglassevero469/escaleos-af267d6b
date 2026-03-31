import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface Template {
  id: string;
  name: string;
  description: string;
  priority: string;
  subtasks: { title: string }[];
  tags: string[];
}

interface DemandTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: Template) => void;
}

export function DemandTemplateDialog({ open, onOpenChange, onUseTemplate }: DemandTemplateDialogProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState("list");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subtasks, setSubtasks] = useState<string[]>([""]);
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open && user) loadTemplates();
  }, [open, user]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("demand_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setTemplates(data.map(t => ({
        ...t,
        description: t.description || "",
        subtasks: (t.subtasks as any[]) || [],
        tags: t.tags || [],
      })));
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    const subtaskObjs = subtasks.filter(s => s.trim()).map(s => ({ title: s.trim() }));
    const tagArr = tags.split(",").map(t => t.trim()).filter(Boolean);

    await supabase.from("demand_templates").insert({
      user_id: user.id,
      name,
      description,
      priority,
      subtasks: subtaskObjs as unknown as Json,
      tags: tagArr,
    });

    toast.success("Template criado!");
    setName(""); setDescription(""); setPriority("medium"); setSubtasks([""]); setTags("");
    setTab("list");
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("demand_templates").delete().eq("id", id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Template excluído");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Templates de Demanda
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="list" className="flex-1">Templates</TabsTrigger>
            <TabsTrigger value="create" className="flex-1">Criar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-3">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum template. Crie um!</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.description || "Sem descrição"}</p>
                      <div className="flex gap-1 mt-1">
                        {t.subtasks.length > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t.subtasks.length} subtarefas</span>
                        )}
                        {t.tags.length > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t.tags.length} tags</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { onUseTemplate(t); onOpenChange(false); }}>
                      Usar
                    </Button>
                    <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-3 space-y-3">
            <div>
              <Label>Nome do Template *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bug Report" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição padrão" />
            </div>
            <div>
              <Label>Prioridade padrão</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subtarefas padrão</Label>
              {subtasks.map((s, i) => (
                <div key={i} className="flex gap-1 mt-1">
                  <Input
                    value={s}
                    onChange={e => setSubtasks(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder={`Subtarefa ${i + 1}`}
                    className="h-8 text-sm"
                  />
                  {subtasks.length > 1 && (
                    <button onClick={() => setSubtasks(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive px-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="ghost" className="mt-1 h-7 text-xs" onClick={() => setSubtasks(prev => [...prev, ""])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="bug, frontend, urgente" />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!name.trim()}>Criar Template</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
