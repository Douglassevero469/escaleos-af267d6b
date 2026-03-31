import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { StageDef } from "./KanbanStageColumn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stages: StageDef[];
}

export function PipelineSettingsDialog({ open, onOpenChange, pipelineId, stages: initialStages }: Props) {
  const qc = useQueryClient();
  const [stages, setStages] = useState<StageDef[]>([]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Configurar Etapas</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="color"
                value={s.color}
                onChange={e => updateStage(s.id, "color", e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
              />
              <Input
                value={s.name}
                onChange={e => updateStage(s.id, "name", e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeStage(s.id)} className="shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
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
