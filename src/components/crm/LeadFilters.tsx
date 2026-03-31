import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { StageDef } from "./KanbanStageColumn";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  stageFilter: string;
  onStageFilterChange: (v: string) => void;
  stages: StageDef[];
}

export function LeadFilters({ search, onSearchChange, stageFilter, onStageFilterChange, stages }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar lead..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 w-[200px]"
        />
      </div>
      <Select value={stageFilter} onValueChange={onStageFilterChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Todas etapas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas etapas</SelectItem>
          {stages.map(s => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
