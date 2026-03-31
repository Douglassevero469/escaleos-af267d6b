import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface Subtask {
  id: string;
  item_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function SubtaskList({ subtasks, onAdd, onToggle, onDelete, onRename }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const total = subtasks.length;
  const completed = subtasks.filter(s => s.completed).length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle("");
  };

  const startEdit = (s: Subtask) => {
    setEditingId(s.id);
    setEditValue(s.title);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Subtarefas</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">{completed}/{total}</span>
        )}
      </div>

      {total > 0 && (
        <Progress value={progress} className="h-1.5" />
      )}

      <div className="space-y-1">
        {subtasks.sort((a, b) => a.position - b.position).map(s => (
          <div key={s.id} className="flex items-center gap-2 group py-0.5">
            <Checkbox
              checked={s.completed}
              onCheckedChange={(checked) => onToggle(s.id, !!checked)}
            />
            {editingId === s.id ? (
              <Input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === "Enter" && saveEdit()}
                className="h-7 text-sm flex-1"
                autoFocus
              />
            ) : (
              <span
                className={cn(
                  "text-sm flex-1 cursor-pointer hover:text-foreground",
                  s.completed && "line-through text-muted-foreground"
                )}
                onClick={() => startEdit(s)}
              >
                {s.title}
              </span>
            )}
            <button
              onClick={() => onDelete(s.id)}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Nova subtarefa..."
          className="h-8 text-sm flex-1"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" variant="outline" onClick={handleAdd} className="h-8 px-2">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SubtaskProgressBar({ subtasks }: { subtasks: Subtask[] }) {
  const total = subtasks.length;
  if (total === 0) return null;
  const completed = subtasks.filter(s => s.completed).length;
  const progress = (completed / total) * 100;

  return (
    <div className="flex items-center gap-1.5 w-full mt-1.5">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{completed}/{total}</span>
    </div>
  );
}
