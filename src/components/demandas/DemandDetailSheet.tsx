import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Send, X, AtSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubtaskList, type Subtask } from "./SubtaskList";
import { AttachmentList } from "./AttachmentList";
import { ActivityLog } from "./ActivityLog";
import { MultiAssigneeInput, parseAssignees, joinAssignees } from "./AssigneeAvatars";
import type { DemandItem } from "./KanbanCard";
import type { ColumnDef } from "./KanbanColumn";

interface DemandDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DemandItem | null;
  columns: ColumnDef[];
  onUpdate: (item: DemandItem) => void;
  onDelete: (id: string) => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
}

export function DemandDetailSheet({ open, onOpenChange, item, columns, onUpdate, onDelete }: DemandDetailSheetProps) {
  const { user } = useAuth();
  const [editItem, setEditItem] = useState<DemandItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  useEffect(() => {
    if (item) {
      setEditItem({ ...item });
      loadComments(item.id);
      loadSubtasks(item.id);
    }
  }, [item]);

  const loadComments = async (itemId: string) => {
    const { data } = await supabase
      .from("demand_comments")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setComments(data.map(c => ({
        ...c,
        display_name: profileMap.get(c.user_id)?.display_name || null,
        avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
      })));
    } else {
      setComments([]);
    }
  };

  const loadSubtasks = async (itemId: string) => {
    const { data } = await supabase.from("demand_subtasks").select("*").eq("item_id", itemId).order("position");
    if (data) setSubtasks(data as Subtask[]);
  };

  const logActivity = async (action: string, details: Record<string, any> = {}) => {
    if (!item || !user) return;
    await supabase.from("demand_activity_log").insert({
      item_id: item.id,
      user_id: user.id,
      action,
      details,
    });
  };

  const addComment = async () => {
    if (!newComment.trim() || !item || !user) return;
    await supabase.from("demand_comments").insert({ item_id: item.id, user_id: user.id, content: newComment });

    // Parse @mentions and create notifications
    const mentions = newComment.match(/@(\w[\w\s]*?)(?=\s@|\s*$|[,.!?])/g);
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        const mentionedName = mention.replace("@", "").trim();
        // Create a notification for the item owner about the mention
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: `Menção em comentário`,
          message: `@${mentionedName} foi mencionado(a) na demanda "${item.title}"`,
          type: "info",
          link: `/demandas`,
        });
      }
      logActivity("mention", { mentions: mentions.map(m => m.replace("@", "").trim()), comment: newComment });
    }

    setNewComment("");
    loadComments(item.id);
  };

  const handleSave = () => {
    if (!editItem || !item) return;
    if (editItem.status !== item.status) {
      const fromCol = columns.find(c => c.id === item.status);
      const toCol = columns.find(c => c.id === editItem.status);
      logActivity("status_changed", { from: fromCol?.name || item.status, to: toCol?.name || editItem.status });
    }
    if (editItem.priority !== item.priority) {
      logActivity("priority_changed", { from: item.priority, to: editItem.priority });
    }
    onUpdate(editItem);
  };

  const renderCommentWithMentions = (text: string) => {
    const parts = text.split(/(@\w[\w\s]*?)(?=\s@|\s*$|[,.!?])/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-primary font-semibold">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const addTag = () => {
    if (tagInput.trim() && editItem) {
      setEditItem({ ...editItem, tags: [...(editItem.tags || []), tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    if (editItem) setEditItem({ ...editItem, tags: (editItem.tags || []).filter(t => t !== tag) });
  };

  // Subtask handlers
  const addSubtask = async (title: string) => {
    if (!item || !user) return;
    const maxPos = subtasks.reduce((max, s) => Math.max(max, s.position), -1);
    await supabase.from("demand_subtasks").insert({ item_id: item.id, user_id: user.id, title, position: maxPos + 1 });
    logActivity("subtask_added", { title });
    loadSubtasks(item.id);
  };

  const toggleSubtask = async (id: string, completed: boolean) => {
    await supabase.from("demand_subtasks").update({ completed }).eq("id", id);
    const st = subtasks.find(s => s.id === id);
    if (st && completed) logActivity("subtask_completed", { title: st.title });
    loadSubtasks(item!.id);

    // Auto-move: if all subtasks completed, move to last column
    if (completed && editItem) {
      const updatedSubtasks = subtasks.map(s => s.id === id ? { ...s, completed } : s);
      const allDone = updatedSubtasks.every(s => s.completed);
      if (allDone && updatedSubtasks.length > 0) {
        const lastCol = [...columns].sort((a, b) => b.order - a.order)[0];
        if (lastCol && editItem.status !== lastCol.id) {
          const updated = { ...editItem, status: lastCol.id };
          setEditItem(updated);
          onUpdate(updated);
          logActivity("status_changed", { from: editItem.status, to: lastCol.name, reason: "Todas subtarefas concluídas" });
        }
      }
    }
  };

  const deleteSubtask = async (id: string) => {
    await supabase.from("demand_subtasks").delete().eq("id", id);
    loadSubtasks(item!.id);
  };

  const renameSubtask = async (id: string, title: string) => {
    await supabase.from("demand_subtasks").update({ title }).eq("id", id);
    loadSubtasks(item!.id);
  };

  if (!editItem) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto p-0">
        <div className="p-6">
          <SheetHeader>
            <SheetTitle className="text-left">Detalhes da Demanda</SheetTitle>
          </SheetHeader>
        </div>

        <Tabs defaultValue="details" className="px-6 pb-6">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="details" className="flex-1 text-xs">Detalhes</TabsTrigger>
            <TabsTrigger value="subtasks" className="flex-1 text-xs">Subtarefas</TabsTrigger>
            <TabsTrigger value="attachments" className="flex-1 text-xs">Anexos</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 text-xs">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-0">
            <div>
              <Label>Título</Label>
              <Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={editItem.status} onValueChange={v => setEditItem({ ...editItem, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={editItem.priority} onValueChange={v => setEditItem({ ...editItem, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Responsáveis</Label>
              <MultiAssigneeInput
                value={parseAssignees(editItem.assignee_name)}
                onChange={(names) => setEditItem({ ...editItem, assignee_name: joinAssignees(names) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={editItem.start_date || ""} onChange={e => setEditItem({ ...editItem, start_date: e.target.value || null })} />
              </div>
              <div>
                <Label>Data Limite</Label>
                <Input type="date" value={editItem.due_date || ""} onChange={e => setEditItem({ ...editItem, due_date: e.target.value || null })} />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(editItem.tags || []).map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Nova tag" onKeyDown={e => e.key === "Enter" && addTag()} className="flex-1" />
                <Button size="sm" variant="outline" onClick={addTag}>+</Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">Salvar</Button>
              <Button variant="destructive" size="icon" onClick={() => { onDelete(editItem.id); onOpenChange(false); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-semibold">Comentários</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
              {comments.map(c => (
                  <div key={c.id} className="bg-muted rounded-lg p-2 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {(c.display_name || 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{c.display_name || 'Usuário'}</span>
                      <span className="text-muted-foreground text-[10px]">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="ml-7">{renderCommentWithMentions(c.content)}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Comentar... use @nome para mencionar"
                onKeyDown={e => e.key === "Enter" && addComment()}
                className="flex-1"
              />
                <Button size="icon" variant="outline" onClick={addComment}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subtasks" className="mt-0">
            <SubtaskList
              subtasks={subtasks}
              onAdd={addSubtask}
              onToggle={toggleSubtask}
              onDelete={deleteSubtask}
              onRename={renameSubtask}
            />
          </TabsContent>

          <TabsContent value="attachments" className="mt-0">
            {item && (
              <AttachmentList
                itemId={item.id}
                onActivityLog={logActivity}
              />
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            {item && <ActivityLog itemId={item.id} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
