import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { KanbanCard, type DemandItem } from "./KanbanCard";
import { cn } from "@/lib/utils";

export interface ColumnDef {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface KanbanColumnProps {
  column: ColumnDef;
  items: DemandItem[];
  onCardClick: (item: DemandItem) => void;
  onAddItem: (columnId: string) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string, checked: boolean) => void;
}

export function KanbanColumn({ column, items, onCardClick, onAddItem, selectable, selectedIds, onSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className={cn("flex flex-col min-w-[280px] max-w-[320px] w-full rounded-xl bg-muted/30 border", isOver && "ring-2 ring-primary/30")}>
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="font-semibold text-sm flex-1">{column.name}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{items.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <KanbanCard
              key={item.id}
              item={item}
              onClick={() => onCardClick(item)}
              selectable={selectable}
              selected={selectedIds?.has(item.id)}
              onSelect={onSelect}
            />
          ))}
        </SortableContext>
      </div>
      <button
        onClick={() => onAddItem(column.id)}
        className="flex items-center gap-1 p-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-b-xl"
      >
        <Plus className="h-3.5 w-3.5" /> Nova demanda
      </button>
    </div>
  );
}
