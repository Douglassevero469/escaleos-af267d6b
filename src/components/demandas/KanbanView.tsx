import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn, type ColumnDef } from "./KanbanColumn";
import type { DemandItem } from "./KanbanCard";

interface KanbanViewProps {
  columns: ColumnDef[];
  items: DemandItem[];
  onItemsChange: (items: DemandItem[]) => void;
  onCardClick: (item: DemandItem) => void;
  onAddItem: (columnId: string) => void;
  onUpdateItem: (item: DemandItem) => void;
}

export function KanbanView({ columns, items, onItemsChange, onCardClick, onAddItem, onUpdateItem }: KanbanViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) return;

    const overId = over.id as string;
    const overItem = items.find(i => i.id === overId);
    const targetColumn = overItem ? overItem.status : overId;

    if (sortedColumns.some(c => c.id === targetColumn)) {
      if (activeItem.status !== targetColumn) {
        const updated = { ...activeItem, status: targetColumn };
        onUpdateItem(updated);
        onItemsChange(items.map(i => i.id === activeItem.id ? updated : i));
      } else if (overItem && activeItem.id !== overItem.id) {
        const colItems = items.filter(i => i.status === targetColumn);
        const oldIdx = colItems.findIndex(i => i.id === activeItem.id);
        const newIdx = colItems.findIndex(i => i.id === overItem.id);
        const reordered = arrayMove(colItems, oldIdx, newIdx);
        const updated = items.map(i => {
          const idx = reordered.findIndex(r => r.id === i.id);
          return idx >= 0 ? { ...i, position: idx } : i;
        });
        onItemsChange(updated);
        reordered.forEach((item, idx) => {
          if (item.position !== idx) onUpdateItem({ ...item, position: idx });
        });
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) return;
    const overId = over.id as string;
    const isColumn = sortedColumns.some(c => c.id === overId);
    if (isColumn && activeItem.status !== overId) {
      onItemsChange(items.map(i => i.id === activeItem.id ? { ...i, status: overId } : i));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {sortedColumns.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            items={items.filter(i => i.status === col.id).sort((a, b) => a.position - b.position)}
            onCardClick={onCardClick}
            onAddItem={onAddItem}
          />
        ))}
      </div>
    </DndContext>
  );
}
