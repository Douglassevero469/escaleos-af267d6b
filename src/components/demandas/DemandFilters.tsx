import { Search, LayoutGrid, List, BarChart3, CalendarDays, Tag, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ViewMode = "kanban" | "list" | "gantt" | "calendar";

interface DemandFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  assigneeFilter?: string;
  onAssigneeChange?: (v: string) => void;
  tagFilter?: string;
  onTagChange?: (v: string) => void;
  assignees?: string[];
  allTags?: string[];
}

export function DemandFilters({
  search, onSearchChange,
  priorityFilter, onPriorityChange,
  viewMode, onViewModeChange,
  assigneeFilter = "all", onAssigneeChange,
  tagFilter = "all", onTagChange,
  assignees = [], allTags = [],
}: DemandFiltersProps) {
  const views: { id: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { id: "kanban", icon: LayoutGrid, label: "Kanban" },
    { id: "list", icon: List, label: "Lista" },
    { id: "gantt", icon: BarChart3, label: "Gantt" },
    { id: "calendar", icon: CalendarDays, label: "Calendário" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
      <div className="relative flex-1 max-w-sm min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Buscar demandas..." className="pl-9" />
      </div>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="urgent">Urgente</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
        </SelectContent>
      </Select>

      {assignees.length > 0 && onAssigneeChange && (
        <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {assignees.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {allTags.length > 0 && onTagChange && (
        <Select value={tagFilter} onValueChange={onTagChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {allTags.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex bg-muted rounded-lg p-0.5">
        {views.map(v => (
          <Button
            key={v.id}
            size="sm"
            variant="ghost"
            className={cn("gap-1.5 h-8 px-3", viewMode === v.id && "bg-background shadow-sm")}
            onClick={() => onViewModeChange(v.id)}
          >
            <v.icon className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{v.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
