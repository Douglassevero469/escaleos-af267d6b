import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DemandItem {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_name: string | null;
  due_date: string | null;
  start_date: string | null;
  tags: string[];
  color: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

const priorityConfig: Record<string, { label: string; class: string }> = {
  urgent: { label: "Urgente", class: "bg-red-500/20 text-red-400 border-red-500/30" },
  high: { label: "Alta", class: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  medium: { label: "Média", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Baixa", class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

interface KanbanCardProps {
  item: DemandItem;
  onClick: () => void;
}

export function KanbanCard({ item, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "item", item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prio = priorityConfig[item.priority] || priorityConfig.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 opacity-0 group-hover:opacity-60 cursor-grab" onClick={e => e.stopPropagation()}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          {item.color && (
            <div className="h-1 w-10 rounded-full mb-2" style={{ backgroundColor: item.color }} />
          )}
          <p className="font-medium text-sm leading-snug">{item.title}</p>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", prio.class)}>{prio.label}</Badge>
            {item.due_date && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(item.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            )}
            {item.assignee_name && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                <User className="h-3 w-3" />
                {item.assignee_name.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
