import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Settings, FileText, CheckSquare, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BoardSelector } from "@/components/demandas/BoardSelector";
import { BoardSettingsDialog } from "@/components/demandas/BoardSettingsDialog";
import { DemandFilters, type ViewMode } from "@/components/demandas/DemandFilters";
import { KanbanView } from "@/components/demandas/KanbanView";
import { ListView } from "@/components/demandas/ListView";
import { GanttView } from "@/components/demandas/GanttView";
import { CalendarView } from "@/components/demandas/CalendarView";
import { NewDemandDialog } from "@/components/demandas/NewDemandDialog";
import { DemandDetailSheet } from "@/components/demandas/DemandDetailSheet";
import { DemandTemplateDialog } from "@/components/demandas/DemandTemplateDialog";
import type { DemandItem } from "@/components/demandas/KanbanCard";
import type { ColumnDef } from "@/components/demandas/KanbanColumn";
import type { Json } from "@/integrations/supabase/types";

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: "todo", name: "A Fazer", color: "#3b82f6", order: 0 },
  { id: "in_progress", name: "Em Andamento", color: "#f59e0b", order: 1 },
  { id: "review", name: "Revisão", color: "#8b5cf6", order: 2 },
  { id: "done", name: "Concluído", color: "#22c55e", order: 3 },
];

interface Board {
  id: string;
  name: string;
  description: string | null;
  columns: ColumnDef[];
}

export default function Demandas() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<DemandItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newDialogStatus, setNewDialogStatus] = useState("todo");
  const [detailItem, setDetailItem] = useState<DemandItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  useEffect(() => { if (user) loadBoards(); }, [user]);
  useEffect(() => { if (currentBoard) loadItems(currentBoard.id); }, [currentBoard]);

  const loadBoards = async () => {
    const { data } = await supabase.from("demand_boards").select("*").order("created_at");
    if (data && data.length > 0) {
      const parsed = data.map(b => ({ ...b, columns: (b.columns as any as ColumnDef[]) || DEFAULT_COLUMNS }));
      setBoards(parsed);
      if (!currentBoard) setCurrentBoard(parsed[0]);
    } else if (user) {
      const { data: newBoard } = await supabase.from("demand_boards").insert({
        user_id: user.id, name: "Meu Board", columns: DEFAULT_COLUMNS as unknown as Json,
      }).select().single();
      if (newBoard) {
        const parsed = { ...newBoard, columns: DEFAULT_COLUMNS };
        setBoards([parsed]);
        setCurrentBoard(parsed);
      }
    }
  };

  const loadItems = async (boardId: string) => {
    const { data } = await supabase.from("demand_items").select("*").eq("board_id", boardId).order("position");
    if (data) {
      // Load subtask counts
      const itemIds = data.map(d => d.id);
      let subtaskMap: Record<string, { total: number; done: number }> = {};
      let attachmentMap: Record<string, number> = {};

      if (itemIds.length > 0) {
        const { data: subtasks } = await supabase.from("demand_subtasks").select("item_id, completed").in("item_id", itemIds);
        if (subtasks) {
          subtasks.forEach(s => {
            if (!subtaskMap[s.item_id]) subtaskMap[s.item_id] = { total: 0, done: 0 };
            subtaskMap[s.item_id].total++;
            if (s.completed) subtaskMap[s.item_id].done++;
          });
        }

        const { data: attachments } = await supabase.from("demand_attachments").select("item_id").in("item_id", itemIds);
        if (attachments) {
          attachments.forEach(a => {
            attachmentMap[a.item_id] = (attachmentMap[a.item_id] || 0) + 1;
          });
        }
      }

      setItems(data.map(d => ({
        ...d as DemandItem,
        subtask_total: subtaskMap[d.id]?.total || 0,
        subtask_done: subtaskMap[d.id]?.done || 0,
        attachment_count: attachmentMap[d.id] || 0,
      })));
    }
  };

  const createBoard = async (name: string, description: string) => {
    if (!user) return;
    const { data } = await supabase.from("demand_boards").insert({
      user_id: user.id, name, description: description || null, columns: DEFAULT_COLUMNS as unknown as Json,
    }).select().single();
    if (data) {
      const parsed = { ...data, columns: DEFAULT_COLUMNS };
      setBoards(prev => [...prev, parsed]);
      setCurrentBoard(parsed);
      toast.success("Board criado!");
    }
  };

  const createItem = async (data: { title: string; description: string; priority: string; status: string; assignee_name: string; due_date: string }) => {
    if (!user || !currentBoard) return;
    const maxPos = items.filter(i => i.status === data.status).reduce((max, i) => Math.max(max, i.position), -1);
    const { data: newItem } = await supabase.from("demand_items").insert({
      board_id: currentBoard.id,
      user_id: user.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      assignee_name: data.assignee_name || null,
      due_date: data.due_date || null,
      position: maxPos + 1,
    }).select().single();
    if (newItem) {
      setItems(prev => [...prev, { ...newItem as DemandItem, subtask_total: 0, subtask_done: 0, attachment_count: 0 }]);
      toast.success("Demanda criada!");

      // Log activity
      await supabase.from("demand_activity_log").insert({
        item_id: newItem.id, user_id: user.id, action: "created", details: { title: data.title },
      });
    }
  };

  const createItemFromTemplate = async (template: { name: string; description: string; priority: string; subtasks: { title: string }[]; tags: string[] }) => {
    if (!user || !currentBoard) return;
    const maxPos = items.filter(i => i.status === "todo").reduce((max, i) => Math.max(max, i.position), -1);
    const { data: newItem } = await supabase.from("demand_items").insert({
      board_id: currentBoard.id,
      user_id: user.id,
      title: template.name,
      description: template.description,
      priority: template.priority,
      status: "todo",
      tags: template.tags,
      position: maxPos + 1,
    }).select().single();

    if (newItem && template.subtasks.length > 0) {
      const subtaskRows = template.subtasks.map((s, i) => ({
        item_id: newItem.id, user_id: user.id, title: s.title, position: i,
      }));
      await supabase.from("demand_subtasks").insert(subtaskRows);
    }

    if (newItem) {
      await supabase.from("demand_activity_log").insert({
        item_id: newItem.id, user_id: user.id, action: "created", details: { title: template.name, from_template: true },
      });
      loadItems(currentBoard.id);
      toast.success("Demanda criada a partir do template!");
    }
  };

  const updateItem = async (item: DemandItem) => {
    await supabase.from("demand_items").update({
      title: item.title, description: item.description, status: item.status,
      priority: item.priority, assignee_name: item.assignee_name, due_date: item.due_date,
      start_date: item.start_date, tags: item.tags, color: item.color, position: item.position,
    }).eq("id", item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...item } : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from("demand_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Demanda excluída!");
  };

  const updateBoardColumns = async (newColumns: ColumnDef[]) => {
    if (!currentBoard) return;
    await supabase.from("demand_boards").update({ columns: newColumns as unknown as Json }).eq("id", currentBoard.id);
    const updated = { ...currentBoard, columns: newColumns };
    setCurrentBoard(updated);
    setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
    toast.success("Colunas atualizadas!");
  };

  // Bulk actions
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const executeBulkAction = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    if (bulkAction === "delete") {
      for (const id of ids) {
        await supabase.from("demand_items").delete().eq("id", id);
      }
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
      toast.success(`${ids.length} demandas excluídas`);
    } else if (["low", "medium", "high", "urgent"].includes(bulkAction)) {
      for (const id of ids) {
        await supabase.from("demand_items").update({ priority: bulkAction }).eq("id", id);
      }
      setItems(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, priority: bulkAction } : i));
      toast.success(`Prioridade alterada para ${ids.length} demandas`);
    } else if (columns.some(c => c.id === bulkAction)) {
      for (const id of ids) {
        await supabase.from("demand_items").update({ status: bulkAction }).eq("id", id);
      }
      setItems(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, status: bulkAction } : i));
      toast.success(`${ids.length} demandas movidas`);
    }

    setSelectedIds(new Set());
    setBulkAction("");
    setBulkMode(false);
  };

  const columns = currentBoard?.columns || DEFAULT_COLUMNS;

  // Derived data for filters
  const assignees = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.assignee_name) set.add(i.assignee_name); });
    return Array.from(set).sort();
  }, [items]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { (i.tags || []).forEach(t => set.add(t)); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all" && i.assignee_name !== assigneeFilter) return false;
      if (tagFilter !== "all" && !(i.tags || []).includes(tagFilter)) return false;
      return true;
    });
  }, [items, search, priorityFilter, assigneeFilter, tagFilter]);

  const handleAddItem = (columnId: string) => {
    setNewDialogStatus(columnId);
    setNewDialogOpen(true);
  };

  const handleCardClick = (item: DemandItem) => {
    if (bulkMode) {
      toggleSelect(item.id, !selectedIds.has(item.id));
      return;
    }
    setDetailItem(item);
    setDetailOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Demandas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as tarefas e demandas do time</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <BoardSelector boards={boards} currentBoard={currentBoard} onSelect={(b) => setCurrentBoard(b as Board)} onCreate={createBoard} />
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)} className="gap-1">
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant={bulkMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
            className="gap-1"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setNewDialogStatus("todo"); setNewDialogOpen(true); }} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60 border">
          <span className="text-sm font-medium">{selectedIds.size} selecionada(s)</span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Ação em massa..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">🗑️ Excluir</SelectItem>
              <SelectItem value="low">Prioridade: Baixa</SelectItem>
              <SelectItem value="medium">Prioridade: Média</SelectItem>
              <SelectItem value="high">Prioridade: Alta</SelectItem>
              <SelectItem value="urgent">Prioridade: Urgente</SelectItem>
              {columns.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3" /> Mover: {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!bulkAction} onClick={executeBulkAction}>Aplicar</Button>
          <Button size="sm" variant="ghost" onClick={() => { setBulkMode(false); setSelectedIds(new Set()); }}>Cancelar</Button>
        </div>
      )}

      <DemandFilters
        search={search} onSearchChange={setSearch}
        priorityFilter={priorityFilter} onPriorityChange={setPriorityFilter}
        viewMode={viewMode} onViewModeChange={setViewMode}
        assigneeFilter={assigneeFilter} onAssigneeChange={setAssigneeFilter}
        tagFilter={tagFilter} onTagChange={setTagFilter}
        assignees={assignees} allTags={allTags}
      />

      {viewMode === "kanban" && (
        <KanbanView
          columns={columns} items={filtered} onItemsChange={setItems}
          onCardClick={handleCardClick} onAddItem={handleAddItem} onUpdateItem={updateItem}
          selectable={bulkMode} selectedIds={selectedIds} onSelect={toggleSelect}
        />
      )}
      {viewMode === "list" && (
        <ListView columns={columns} items={filtered} onCardClick={handleCardClick} onUpdateItem={updateItem} />
      )}
      {viewMode === "gantt" && (
        <GanttView columns={columns} items={filtered} onCardClick={handleCardClick} />
      )}
      {viewMode === "calendar" && (
        <CalendarView columns={columns} items={filtered} onCardClick={handleCardClick} />
      )}

      <NewDemandDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} defaultStatus={newDialogStatus} onSubmit={createItem} />
      <DemandDetailSheet
        open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open && currentBoard) loadItems(currentBoard.id); }}
        item={detailItem} columns={columns}
        onUpdate={(item) => { updateItem(item); setDetailItem(item); toast.success("Salvo!"); }}
        onDelete={deleteItem}
      />
      <BoardSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} columns={columns} onSave={updateBoardColumns} />
      <DemandTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} onUseTemplate={createItemFromTemplate} />
    </div>
  );
}
