import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DemandItem } from "./KanbanCard";
import type { ColumnDef } from "./KanbanColumn";

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

interface GanttViewProps {
  columns: ColumnDef[];
  items: DemandItem[];
  onCardClick: (item: DemandItem) => void;
}

export function GanttView({ columns, items, onCardClick }: GanttViewProps) {
  const today = new Date();

  const { startDate, days, ganttItems } = useMemo(() => {
    const withDates = items.filter(i => i.start_date || i.due_date);
    if (withDates.length === 0) {
      const s = new Date(today);
      s.setDate(s.getDate() - 3);
      return { startDate: s, days: 30, ganttItems: [] };
    }

    const allDates = withDates.flatMap(i => {
      const dates: Date[] = [];
      if (i.start_date) dates.push(new Date(i.start_date));
      if (i.due_date) dates.push(new Date(i.due_date));
      return dates;
    });

    const min = new Date(Math.min(...allDates.map(d => d.getTime())));
    const max = new Date(Math.max(...allDates.map(d => d.getTime())));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 7);
    const totalDays = Math.max(14, Math.ceil((max.getTime() - min.getTime()) / 86400000));

    return { startDate: min, days: totalDays, ganttItems: withDates };
  }, [items]);

  const dayHeaders = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayWidth = 36;

  const getOffset = (date: string) => {
    const d = new Date(date);
    return Math.round((d.getTime() - startDate.getTime()) / 86400000);
  };

  if (ganttItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Adicione datas de início e limite nas demandas para visualizar o Gantt
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 250 + days * dayWidth }}>
          {/* Header */}
          <div className="flex border-b sticky top-0 bg-card z-10">
            <div className="w-[250px] min-w-[250px] p-2 text-xs font-semibold border-r">Demanda</div>
            <div className="flex">
              {dayHeaders.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{ width: dayWidth }}
                    className={cn(
                      "text-center text-[10px] py-1 border-r",
                      isToday && "bg-primary/10 font-bold",
                      isWeekend && "bg-muted/50"
                    )}
                  >
                    <div>{d.getDate()}</div>
                    <div className="text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Rows */}
          {ganttItems.map(item => {
            const sDate = item.start_date || item.due_date!;
            const eDate = item.due_date || item.start_date!;
            const startOff = getOffset(sDate);
            const endOff = getOffset(eDate);
            const barLeft = startOff * dayWidth;
            const barWidth = Math.max((endOff - startOff + 1) * dayWidth, dayWidth);
            const col = columns.find(c => c.id === item.status);

            return (
              <div key={item.id} className="flex border-b hover:bg-muted/30 cursor-pointer" onClick={() => onCardClick(item)}>
                <div className="w-[250px] min-w-[250px] p-2 border-r flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col?.color || "#888" }} />
                  <span className="text-xs truncate">{item.title}</span>
                </div>
                <div className="relative flex-1" style={{ height: 36 }}>
                  <div className="flex h-full">
                    {dayHeaders.map((d, i) => (
                      <div key={i} style={{ width: dayWidth }} className={cn("border-r h-full", (d.getDay() === 0 || d.getDay() === 6) && "bg-muted/30")} />
                    ))}
                  </div>
                  <div
                    className="absolute top-1.5 h-5 rounded-full text-[10px] text-white flex items-center px-2 truncate font-medium"
                    style={{
                      left: barLeft,
                      width: barWidth,
                      backgroundColor: priorityColors[item.priority] || "#888",
                    }}
                  >
                    {barWidth > 80 ? item.title : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
