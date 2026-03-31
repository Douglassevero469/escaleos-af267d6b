import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
}

export function DemandDetailSheet({ open, onOpenChange, item, columns, onUpdate, onDelete }: DemandDetailSheetProps) {
  const { user } = useAuth();
  const [editItem, setEditItem] = useState<DemandItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (item) {
      setEditItem({ ...item });
      loadComments(item.id);
    }
  }, [item]);

  const loadComments = async (itemId: string) => {
    const { data } = await supabase.from("demand_comments").select("*").eq("item_id", itemId).order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const addComment = async () => {
    if (!newComment.trim() || !item || !user) return;
    await supabase.from("demand_comments").insert({ item_id: item.id, user_id: user.id, content: newComment });
    setNewComment("");
    loadComments(item.id);
  };

  const handleSave = () => {
    if (editItem) onUpdate(editItem);
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

  if (!editItem) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Detalhes da Demanda</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Título</Label>
            <Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} rows={4} />
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
            <Label>Responsável</Label>
            <Input value={editItem.assignee_name || ""} onChange={e => setEditItem({ ...editItem, assignee_name: e.target.value })} />
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
                  <p>{c.content}</p>
                  <span className="text-muted-foreground text-[10px]">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Adicionar comentário..." onKeyDown={e => e.key === "Enter" && addComment()} className="flex-1" />
              <Button size="icon" variant="outline" onClick={addComment}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
