import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardSelector } from "@/components/demandas/BoardSelector";
import { BoardSettingsDialog } from "@/components/demandas/BoardSettingsDialog";
import { DemandFilters, type ViewMode } from "@/components/demandas/DemandFilters";
import { KanbanView } from "@/components/demandas/KanbanView";
import { ListView } from "@/components/demandas/ListView";
import { GanttView } from "@/components/demandas/GanttView";
import { NewDemandDialog } from "@/components/demandas/NewDemandDialog";
import { DemandDetailSheet } from "@/components/demandas/DemandDetailSheet";
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
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newDialogStatus, setNewDialogStatus] = useState("todo");
  const [detailItem, setDetailItem] = useState<DemandItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => { if (user) loadBoards(); }, [user]);
  useEffect(() => { if (currentBoard) loadItems(currentBoard.id); }, [currentBoard]);

  const loadBoards = async () => {
    const { data } = await supabase.from("demand_boards").select("*").order("created_at");
    if (data && data.length > 0) {
      const parsed = data.map(b => ({ ...b, columns: (b.columns as any as ColumnDef[]) || DEFAULT_COLUMNS }));
      setBoards(parsed);
      if (!currentBoard) setCurrentBoard(parsed[0]);
    } else if (user) {
      // Auto-create first board
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
    if (data) setItems(data as DemandItem[]);
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
      setItems(prev => [...prev, newItem as DemandItem]);
      toast.success("Demanda criada!");
    }
  };

  const updateItem = async (item: DemandItem) => {
    await supabase.from("demand_items").update({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      assignee_name: item.assignee_name,
      due_date: item.due_date,
      start_date: item.start_date,
      tags: item.tags,
      color: item.color,
      position: item.position,
    }).eq("id", item.id);
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from("demand_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Demanda excluída!");
  };

  const columns = currentBoard?.columns || DEFAULT_COLUMNS;

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
      return true;
    });
  }, [items, search, priorityFilter]);

  const handleAddItem = (columnId: string) => {
    setNewDialogStatus(columnId);
    setNewDialogOpen(true);
  };

  const handleCardClick = (item: DemandItem) => {
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
        <div className="flex items-center gap-2">
          <BoardSelector boards={boards} currentBoard={currentBoard} onSelect={(b) => setCurrentBoard(b as Board)} onCreate={createBoard} />
          <Button onClick={() => { setNewDialogStatus("todo"); setNewDialogOpen(true); }} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>
      </div>

      <DemandFilters
        search={search} onSearchChange={setSearch}
        priorityFilter={priorityFilter} onPriorityChange={setPriorityFilter}
        viewMode={viewMode} onViewModeChange={setViewMode}
      />

      {viewMode === "kanban" && (
        <KanbanView columns={columns} items={filtered} onItemsChange={setItems} onCardClick={handleCardClick} onAddItem={handleAddItem} onUpdateItem={updateItem} />
      )}
      {viewMode === "list" && (
        <ListView columns={columns} items={filtered} onCardClick={handleCardClick} onUpdateItem={updateItem} />
      )}
      {viewMode === "gantt" && (
        <GanttView columns={columns} items={filtered} onCardClick={handleCardClick} />
      )}

      <NewDemandDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} defaultStatus={newDialogStatus} onSubmit={createItem} />
      <DemandDetailSheet
        open={detailOpen} onOpenChange={setDetailOpen} item={detailItem} columns={columns}
        onUpdate={(item) => { updateItem(item); setDetailItem(item); toast.success("Salvo!"); }}
        onDelete={deleteItem}
      />
    </div>
  );
}
