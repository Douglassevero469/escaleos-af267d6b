import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { KanbanStageColumn, type StageDef } from "./KanbanStageColumn";
import { LeadCard, type CrmLead } from "./LeadCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Props {
  stages: StageDef[];
  leads: CrmLead[];
  onLeadClick: (lead: CrmLead) => void;
  onAddLead: (stageId: string) => void;
}

export function KanbanBoard({ stages, leads, onLeadClick, onAddLead }: Props) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const moveLead = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: string }) => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead || lead.stage === newStage) return;

      const fromName = stages.find(s => s.id === lead.stage)?.name || lead.stage;
      const toName = stages.find(s => s.id === newStage)?.name || newStage;

      await supabase.from("crm_leads").update({ stage: newStage }).eq("id", leadId);
      await supabase.from("crm_activities").insert({
        lead_id: leadId,
        user_id: lead.user_id,
        type: "stage_change",
        content: `Movido de "${fromName}" para "${toName}"`,
        details: { from: lead.stage, to: newStage, from_name: fromName, to_name: toName },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const isStage = stages.some(s => s.id === overId);
    const targetStage = isStage ? overId : leads.find(l => l.id === overId)?.stage;
    if (targetStage) {
      moveLead.mutate({ leadId: String(active.id), newStage: targetStage });
    }
  };

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const activeLead = leads.find(l => l.id === activeId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedStages.map(stage => (
          <KanbanStageColumn
            key={stage.id}
            stage={stage}
            leads={leads.filter(l => l.stage === stage.id)}
            onLeadClick={onLeadClick}
            onAddLead={onAddLead}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
