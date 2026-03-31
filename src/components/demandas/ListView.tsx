import { ArrowUpDown, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DemandItem } from "./KanbanCard";
import type { ColumnDef } from "./KanbanColumn";
import { useState } from "react";

const priorityConfig: Record<string, { label: string; class: string }> = {
  urgent: { label: "Urgente", class: "bg-red-500/20 text-red-400" },
  high: { label: "Alta", class: "bg-orange-500/20 text-orange-400" },
  medium: { label: "Média", class: "bg-yellow-500/20 text-yellow-400" },
  low: { label: "Baixa", class: "bg-blue-500/20 text-blue-400" },
};

interface ListViewProps {
  columns: ColumnDef[];
  items: DemandItem[];
  onCardClick: (item: DemandItem) => void;
  onUpdateItem: (item: DemandItem) => void;
}

export function ListView({ columns, items, onCardClick, onUpdateItem }: ListViewProps) {
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...items].sort((a, b) => {
    const va = (a as any)[sortKey] ?? "";
    const vb = (b as any)[sortKey] ?? "";
    return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3" /></span>
    </TableHead>
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Título" field="title" />
            <TableHead>Status</TableHead>
            <SortHeader label="Prioridade" field="priority" />
            <SortHeader label="Responsável" field="assignee_name" />
            <SortHeader label="Data Limite" field="due_date" />
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(item => {
            const prio = priorityConfig[item.priority] || priorityConfig.medium;
            const col = columns.find(c => c.id === item.status);
            return (
              <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onCardClick(item)}>
                <TableCell className="font-medium max-w-[250px] truncate">{item.title}</TableCell>
                <TableCell>
                  <Select
                    value={item.status}
                    onValueChange={v => { onUpdateItem({ ...item, status: v }); }}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs" onClick={e => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px]", prio.class)}>{prio.label}</Badge>
                </TableCell>
                <TableCell>
                  {item.assignee_name ? (
                    <span className="flex items-center gap-1 text-xs"><User className="h-3 w-3" />{item.assignee_name}</span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {item.due_date ? (
                    <span className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" />{new Date(item.due_date).toLocaleDateString("pt-BR")}</span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {(item.tags || []).slice(0, 2).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{t}</span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {sorted.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma demanda encontrada</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
