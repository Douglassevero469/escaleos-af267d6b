import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { LeadCard, type CrmLead } from "./LeadCard";
import { cn } from "@/lib/utils";

export interface StageDef {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Props {
  stage: StageDef;
  leads: CrmLead[];
  onLeadClick: (lead: CrmLead) => void;
  onAddLead: (stageId: string) => void;
}

export function KanbanStageColumn({ stage, leads, onLeadClick, onAddLead }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = leads.reduce((s, l) => s + Number(l.value || 0), 0);

  return (
    <div className={cn("flex flex-col min-w-[260px] max-w-[300px] w-full rounded-xl bg-muted/30 border", isOver && "ring-2 ring-primary/30")}>
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
        <span className="font-semibold text-sm flex-1 truncate">{stage.name}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{leads.length}</span>
      </div>
      {totalValue > 0 && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-b">
          Total: {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      )}
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 min-h-[80px] overflow-y-auto max-h-[calc(100vh-320px)]">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
          ))}
        </SortableContext>
      </div>
      <button
        onClick={() => onAddLead(stage.id)}
        className="flex items-center gap-1 p-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-b-xl"
      >
        <Plus className="h-3.5 w-3.5" /> Novo lead
      </button>
    </div>
  );
}
