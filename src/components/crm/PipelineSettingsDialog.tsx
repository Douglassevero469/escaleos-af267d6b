import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { StageDef } from "./KanbanStageColumn";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stages: StageDef[];
}

function SortableStageItem({
  stage,
  onUpdate,
  onRemove,
}: {
  stage: StageDef;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-2 bg-background rounded-md p-1", isDragging && "opacity-50 shadow-lg z-50")}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0 p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <input
        type="color"
        value={stage.color}
        onChange={e => onUpdate(stage.id, "color", e.target.value)}
        className="h-8 w-8 rounded cursor-pointer border-0 p-0 shrink-0"
      />
      <Input
        value={stage.name}
        onChange={e => onUpdate(stage.id, "name", e.target.value)}
        className="flex-1"
      />
      <Button variant="ghost" size="icon" onClick={() => onRemove(stage.id)} className="shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function PipelineSettingsDialog({ open, onOpenChange, pipelineId, stages: initialStages }: Props) {
  const qc = useQueryClient();
  const [stages, setStages] = useState<StageDef[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setStages([...initialStages].sort((a, b) => a.order - b.order));
  }, [initialStages, open]);

  const save = useMutation({
    mutationFn: async () => {
      const ordered = stages.map((s, i) => ({ ...s, order: i }));
      await supabase.from("crm_pipelines").update({ stages: ordered }).eq("id", pipelineId);
    },
    onSuccess: () => {
      toast.success("Etapas atualizadas");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["crm-pipelines"] });
    },
  });

  const addStage = () => {
    const id = `stage_${Date.now()}`;
    setStages([...stages, { id, name: "Nova Etapa", color: "#6b7280", order: stages.length }]);
  };

  const removeStage = (id: string) => setStages(stages.filter(s => s.id !== id));
  const updateStage = (id: string, field: string, value: string) =>
    setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setStages(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id);
      const newIndex = prev.findIndex(s => s.id === String(over.id));
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Configurar Etapas</DialogTitle></DialogHeader>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stages.map(s => (
                <SortableStageItem key={s.id} stage={s} onUpdate={updateStage} onRemove={removeStage} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button variant="outline" size="sm" onClick={addStage} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar etapa
        </Button>
        <DialogFooter>
          <Button onClick={() => save.mutate()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
