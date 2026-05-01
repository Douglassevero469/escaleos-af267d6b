import { useState } from "react";
import { ExecCard } from "@/components/financeiro/ExecPanel";
import { buildCashflowHeatmap } from "@/lib/finance-analytics";
import { formatBRL } from "@/lib/finance-utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  transactions: any[];
}

export function FinanceCashflowHeatmap({ transactions }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const data = buildCashflowHeatmap(transactions, year, month);
  const maxNet = Math.max(...data.map((d) => Math.abs(d.net)), 1);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // Pad the calendar (start the month on the correct weekday)
  const firstDay = new Date(year, month, 1).getDay();
  const padding = Array.from({ length: firstDay });

  const monthLabel = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function getColorClass(net: number, count: number) {
    if (count === 0) return "bg-muted/20 text-muted-foreground/50";
    const intensity = Math.min(1, Math.abs(net) / maxNet);
    if (net > 0) {
      if (intensity > 0.66) return "bg-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40";
      if (intensity > 0.33) return "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300";
      return "bg-emerald-500/10 text-foreground";
    }
    if (net < 0) {
      if (intensity > 0.66) return "bg-rose-500/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40";
      if (intensity > 0.33) return "bg-rose-500/25 text-rose-700 dark:text-rose-300";
      return "bg-rose-500/10 text-foreground";
    }
    return "bg-muted/40 text-foreground";
  }

  return (
    <ExecCard
      title="Heatmap de Caixa"
      subtitle="Calendário mensal: dias com mais entrada (verde) ou saída (vermelho)"
      info="Visualização em mapa de calor dos lançamentos diários. Verde indica dias com saldo positivo (mais entrada que saída) e vermelho indica saída líquida. A intensidade da cor reflete o volume. Use para identificar concentrações de pagamento e planejar reservas."
      actions={
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[120px] text-center">{monthLabel}</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1.5">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center pb-1">
            {d}
          </div>
        ))}
        {padding.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {data.map((cell) => {
          const day = Number(cell.date.slice(8, 10));
          return (
            <div
              key={cell.date}
              className={`aspect-square rounded-md flex flex-col items-center justify-center p-1 transition-all hover:scale-110 cursor-default ${getColorClass(cell.net, cell.count)}`}
              title={`${cell.date} · Entrada: ${formatBRL(cell.in)} · Saída: ${formatBRL(cell.out)} · Saldo: ${formatBRL(cell.net)}`}
            >
              <span className="text-xs font-semibold">{day}</span>
              {cell.count > 0 && (
                <span className="text-[8px] tabular-nums opacity-75 leading-none mt-0.5">
                  {cell.net >= 0 ? "+" : ""}{Math.abs(cell.net) >= 1000 ? `${(cell.net / 1000).toFixed(0)}k` : cell.net.toFixed(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/40" /> Entrada líquida
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500/40" /> Saída líquida
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-muted/40" /> Sem movimento
        </span>
      </div>
    </ExecCard>
  );
}
