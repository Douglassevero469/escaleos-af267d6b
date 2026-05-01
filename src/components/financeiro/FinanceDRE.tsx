import { ExecCard } from "@/components/financeiro/ExecPanel";
import { computeDRE } from "@/lib/finance-analytics";
import { formatBRL } from "@/lib/finance-utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  mrr: number;
  teamCost: number;
  fixedExp: number;
  marketingExp?: number;
}

export function FinanceDRE({ mrr, teamCost, fixedExp, marketingExp = 0 }: Props) {
  const [taxRate, setTaxRate] = useState(8);

  const lines = computeDRE({ mrr, teamCost, fixedExp, marketingExp, taxRate });

  return (
    <ExecCard
      title="DRE Simplificado"
      subtitle="Demonstrativo de Resultado mensal"
      info="DRE (Demonstrativo de Resultado do Exercício) mostra como a receita bruta vira lucro líquido após impostos, custos e despesas. É a visão contábil padrão usada por contadores e investidores. Ajuste a alíquota de impostos conforme seu regime tributário (Simples Nacional ~6-8%, Lucro Presumido ~14%)."
      actions={
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">% Impostos:</Label>
          <Input
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-20 h-8"
          />
        </div>
      }
    >
      <div className="space-y-1">
        {lines.map((line, i) => {
          const isTotal = line.type === "total";
          const isSubtotal = line.type === "subtotal";
          const isHeader = line.type === "header";
          const isDeduction = line.type === "deduction";

          return (
            <div
              key={i}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                isTotal
                  ? "bg-primary/10 border-y border-primary/30 font-semibold"
                  : isSubtotal
                  ? "bg-muted/40 font-medium"
                  : isHeader
                  ? "border-b border-border/40 font-medium"
                  : "hover:bg-muted/20"
              }`}
            >
              <span
                className={`text-sm ${
                  isTotal
                    ? "text-foreground"
                    : isDeduction
                    ? "text-muted-foreground pl-6"
                    : "text-foreground"
                }`}
              >
                {line.label}
              </span>
              <div className="flex items-center gap-3">
                {"percent" in line && line.percent !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                    {line.percent.toFixed(1)}%
                  </span>
                )}
                <span
                  className={`tabular-nums text-sm ${
                    isTotal
                      ? line.value >= 0
                        ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)] font-semibold"
                        : "text-destructive font-semibold"
                      : isDeduction
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {formatBRL(line.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ExecCard>
  );
}
