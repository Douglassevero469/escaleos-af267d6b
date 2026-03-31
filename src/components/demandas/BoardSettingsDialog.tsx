import { useState } from "react";
import { GripVertical, Plus, Trash2, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ColumnDef } from "./KanbanColumn";

const PRESET_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
  "#a855f7", "#84cc16", "#e11d48", "#0ea5e9", "#d946ef",
];

interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  onSave: (columns: ColumnDef[]) => void;
}

export function BoardSettingsDialog({ open, onOpenChange, columns, onSave }: BoardSettingsDialogProps) {
  const [cols, setCols] = useState<ColumnDef[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setCols(columns.map(c => ({ ...c })));
    onOpenChange(isOpen);
  };

  const updateCol = (index: number, patch: Partial<ColumnDef>) => {
    setCols(prev => prev.map((c, i) => i === index ? { ...c, ...patch } : c));
  };

  const addColumn = () => {
    const id = `col_${Date.now()}`;
    setCols(prev => [...prev, { id, name: "Nova Coluna", color: "#6366f1", order: prev.length }]);
  };

  const removeColumn = (index: number) => {
    if (cols.length <= 1) return;
    setCols(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i })));
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= cols.length) return;
    setCols(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((c, i) => ({ ...c, order: i }));
    });
  };

  const handleSave = () => {
    onSave(cols.map((c, i) => ({ ...c, order: i })));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Colunas</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {cols.map((col, i) => (
            <div key={col.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveColumn(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none"
                >▲</button>
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                <button
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === cols.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none"
                >▼</button>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="h-8 w-8 rounded-md border flex-shrink-0 flex items-center justify-center hover:ring-2 hover:ring-ring transition-all"
                    style={{ backgroundColor: col.color }}
                  >
                    <Palette className="h-3.5 w-3.5 text-white drop-shadow" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateCol(i, { color })}
                        className="h-7 w-7 rounded-md border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: col.color === color ? "white" : "transparent",
                          boxShadow: col.color === color ? `0 0 0 2px ${color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs">Cor customizada</Label>
                    <Input
                      type="color"
                      value={col.color}
                      onChange={e => updateCol(i, { color: e.target.value })}
                      className="h-8 w-full p-0.5 cursor-pointer"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Input
                value={col.name}
                onChange={e => updateCol(i, { name: e.target.value })}
                className="h-8 text-sm flex-1"
                placeholder="Nome da coluna"
              />

              <button
                onClick={() => removeColumn(i)}
                disabled={cols.length <= 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-20 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addColumn} className="w-full gap-1">
          <Plus className="h-4 w-4" /> Adicionar Coluna
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
