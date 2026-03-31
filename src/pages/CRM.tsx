import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PipelineSelector } from "@/components/crm/PipelineSelector";
import { PipelineSettingsDialog } from "@/components/crm/PipelineSettingsDialog";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { CrmListView } from "@/components/crm/CrmListView";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { LeadFilters } from "@/components/crm/LeadFilters";
import { NewLeadDialog } from "@/components/crm/NewLeadDialog";
import type { CrmLead } from "@/components/crm/LeadCard";
import type { StageDef } from "@/components/crm/KanbanStageColumn";
import { Button } from "@/components/ui/button";
import { Settings, LayoutGrid, List, BarChart3 } from "lucide-react";
import { CrmAnalytics } from "@/components/crm/CrmAnalytics";

export default function CRM() {
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "list" | "analytics">("kanban");
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState("new");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const { data: pipeline } = useQuery({
    queryKey: ["crm-pipeline-detail", pipelineId],
    queryFn: async () => {
      if (!pipelineId) return null;
      const { data } = await supabase.from("crm_pipelines").select("*").eq("id", pipelineId).single();
      return data;
    },
    enabled: !!pipelineId,
  });

  const stages: StageDef[] = useMemo(() => {
    if (!pipeline?.stages) return [];
    return (pipeline.stages as any[]).sort((a, b) => a.order - b.order);
  }, [pipeline]);

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads", pipelineId],
    queryFn: async () => {
      if (!pipelineId) return [];
      const { data } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("pipeline_id", pipelineId)
        .order("position");
      return (data || []) as CrmLead[];
    },
    enabled: !!pipelineId,
  });

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all") {
      result = result.filter(l => l.stage === stageFilter);
    }
    return result;
  }, [leads, search, stageFilter]);

  const openLead = (lead: CrmLead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleAddLead = (stageId: string) => {
    setNewLeadStage(stageId);
    setNewLeadOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>
        <div className="flex items-center gap-2">
          <PipelineSelector selectedId={pipelineId} onSelect={setPipelineId} />
          {pipelineId && (
            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {pipelineId && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <LeadFilters
            search={search}
            onSearchChange={setSearch}
            stageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
            stages={stages}
          />
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setView("kanban")}>
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>
              <List className="h-4 w-4 mr-1" /> Lista
            </Button>
          </div>
        </div>
      )}

      {pipelineId && view === "kanban" && (
        <KanbanBoard stages={stages} leads={filteredLeads} onLeadClick={openLead} onAddLead={handleAddLead} />
      )}

      {pipelineId && view === "list" && (
        <CrmListView leads={filteredLeads} stages={stages} onLeadClick={openLead} />
      )}

      {!pipelineId && (
        <div className="flex items-center justify-center h-[40vh] text-muted-foreground">
          Crie ou selecione um pipeline para começar
        </div>
      )}

      <LeadDetailSheet
        lead={selectedLead}
        stages={stages}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        pipelineId={pipelineId || ""}
      />

      {pipelineId && (
        <>
          <PipelineSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            pipelineId={pipelineId}
            stages={stages}
          />
          <NewLeadDialog
            open={newLeadOpen}
            onOpenChange={setNewLeadOpen}
            pipelineId={pipelineId}
            stageId={newLeadStage}
          />
        </>
      )}
    </div>
  );
}
