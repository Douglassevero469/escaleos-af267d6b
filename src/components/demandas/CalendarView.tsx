import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DemandItem } from "./KanbanCard";
import type { ColumnDef } from "./KanbanColumn";

interface CalendarViewProps {
  columns: ColumnDef[];
  items: DemandItem[];
  onCardClick: (item: DemandItem) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export function CalendarView({ columns, items, onCardClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Next month fill
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, DemandItem[]>();
    items.forEach(item => {
      if (item.due_date) {
        const key = item.due_date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
      }
    });
    return map;
  }, [items]);

  const formatKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const today = formatKey(new Date());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="text-sm font-semibold capitalize">{monthName}</h3>
        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {WEEKDAYS.map(day => (
          <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {calendarDays.map((day, idx) => {
          const key = formatKey(day.date);
          const dayItems = itemsByDate.get(key) || [];
          const isToday = key === today;

          return (
            <div
              key={idx}
              className={cn(
                "bg-card min-h-[80px] p-1 text-xs",
                !day.isCurrentMonth && "opacity-40"
              )}
            >
              <div className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full mb-0.5 text-[11px]",
                isToday && "bg-primary text-primary-foreground font-bold"
              )}>
                {day.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map(item => {
                  const col = columns.find(c => c.id === item.status);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onCardClick(item)}
                      className="w-full text-left px-1 py-0.5 rounded text-[10px] truncate hover:bg-muted/80 transition-colors flex items-center gap-1"
                      style={{ borderLeft: `2px solid ${col?.color || '#888'}` }}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", priorityColors[item.priority] || "bg-muted")} />
                      {item.title}
                    </button>
                  );
                })}
                {dayItems.length > 3 && (
                  <span className="text-[9px] text-muted-foreground pl-1">+{dayItems.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
