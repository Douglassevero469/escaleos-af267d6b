import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export type PeriodType = "month" | "quarter" | "year" | "custom";

export interface Period {
  type: PeriodType;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  anchor: string; // reference YYYY-MM-DD for navigation
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function buildPeriod(type: PeriodType, anchor: Date, customStart?: string, customEnd?: string): Period {
  if (type === "custom") {
    const s = customStart || fmt(anchor);
    const e = customEnd || fmt(anchor);
    return { type, start: s, end: e, anchor: fmt(anchor), label: `${s.split("-").reverse().join("/")} → ${e.split("-").reverse().join("/")}` };
  }
  if (type === "month") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const label = anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { type, start: fmt(start), end: fmt(end), anchor: fmt(anchor), label: label.charAt(0).toUpperCase() + label.slice(1) };
  }
  if (type === "quarter") {
    const q = Math.floor(anchor.getMonth() / 3);
    const start = new Date(anchor.getFullYear(), q * 3, 1);
    const end = new Date(anchor.getFullYear(), q * 3 + 3, 0);
    return { type, start: fmt(start), end: fmt(end), anchor: fmt(anchor), label: `${q + 1}º Trim. ${anchor.getFullYear()}` };
  }
  // year
  const start = new Date(anchor.getFullYear(), 0, 1);
  const end = new Date(anchor.getFullYear(), 11, 31);
  return { type, start: fmt(start), end: fmt(end), anchor: fmt(anchor), label: String(anchor.getFullYear()) };
}

export function shiftPeriod(p: Period, dir: -1 | 1): Period {
  if (p.type === "custom") return p;
  const a = new Date(p.anchor);
  const next = new Date(a);
  if (p.type === "month") next.setMonth(a.getMonth() + dir);
  else if (p.type === "quarter") next.setMonth(a.getMonth() + dir * 3);
  else next.setFullYear(a.getFullYear() + dir);
  return buildPeriod(p.type, next);
}

export function inPeriod(date: string | null | undefined, p: Period): boolean {
  if (!date) return false;
  const d = date.slice(0, 10);
  return d >= p.start && d <= p.end;
}

/** Number of months in the period (used to scale recurring values). */
export function monthsInPeriod(p: Period): number {
  if (p.type === "month") return 1;
  if (p.type === "quarter") return 3;
  if (p.type === "year") return 12;
  // custom — approximate
  const s = new Date(p.start), e = new Date(p.end);
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1);
}

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodFilter({ value, onChange }: Props) {
  const isCustom = value.type === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.type}
        onValueChange={(v) => {
          const t = v as PeriodType;
          if (t === "custom") {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            onChange(buildPeriod("custom", today, fmt(start), fmt(today)));
          } else {
            onChange(buildPeriod(t, new Date(value.anchor)));
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Mensal</SelectItem>
          <SelectItem value="quarter">Trimestral</SelectItem>
          <SelectItem value="year">Anual</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {!isCustom && (
        <div className="inline-flex items-center rounded-md border bg-card">
          <Button variant="ghost" size="icon" className="h-9 w-8" onClick={() => onChange(shiftPeriod(value, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 text-sm font-medium min-w-[140px] text-center capitalize">{value.label}</div>
          <Button variant="ghost" size="icon" className="h-9 w-8" onClick={() => onChange(shiftPeriod(value, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isCustom && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <CalendarIcon className="h-4 w-4" />
              {value.label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">De</label>
                <Input type="date" value={value.start}
                  onChange={(e) => onChange(buildPeriod("custom", new Date(value.anchor), e.target.value, value.end))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Até</label>
                <Input type="date" value={value.end}
                  onChange={(e) => onChange(buildPeriod("custom", new Date(value.anchor), value.start, e.target.value))} />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Button variant="ghost" size="sm" className="h-9 text-xs"
        onClick={() => onChange(buildPeriod(value.type === "custom" ? "month" : value.type, new Date()))}>
        Hoje
      </Button>
    </div>
  );
}
