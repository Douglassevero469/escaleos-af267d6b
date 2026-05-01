import { useState } from "react";
import { ExecCard } from "@/components/financeiro/ExecPanel";
import { runScenario } from "@/lib/finance-analytics";
import { formatBRL } from "@/lib/finance-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wand2 } from "lucide-react";

interface Props {
  baseMRR: number;
  baseExp: number;
  baseCash: number;
}

const PRESETS = [
  { name: "Contratar 1 dev (R$8k)", deltaExp: 8000, deltaRev: 0 },
  { name: "Perder maior cliente", deltaExp: 0, deltaRev: -10000 },
  { name: "Conquistar +3 clientes (R$15k)", deltaExp: 0, deltaRev: 15000 },
  { name: "Cortar 20% das despesas", deltaExp: -0.2, deltaRev: 0, isPercent: true },
  { name: "Reajuste IPCA 4,5%", deltaExp: 0, deltaRev: 0.045, isPercent: true },
];

export function FinanceScenarios({ baseMRR, baseExp, baseCash }: Props) {
  const [deltaRev, setDeltaRev] = useState(0);
  const [deltaExp, setDeltaExp] = useState(0);

  function applyPreset(p: typeof PRESETS[0]) {
    if (p.isPercent) {
      setDeltaRev(Math.round(baseMRR * (p.deltaRev as number)));
      setDeltaExp(Math.round(baseExp * (p.deltaExp as number)));
    } else {
      setDeltaRev(p.deltaRev as number);
      setDeltaExp(p.deltaExp as number);
    }
  }

  const result = runScenario({ baseMRR, baseExp, baseCash, deltaRevenue: deltaRev, deltaExpense: deltaExp });
  const baseResult = baseMRR - baseExp;
  const better = result.newResult > baseResult;

  return (
    <ExecCard
      title="Simulador de Cenários (What-if)"
      subtitle="Teste hipóteses antes de tomar decisões"
      info="Simule o impacto de decisões antes de tomá-las: contratar alguém, perder um cliente, cortar despesas, etc. O simulador recalcula resultado, runway e caixa em 12 meses com base nas variações que você definir."
    >
      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cenários rápidos</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.name} size="sm" variant="outline" className="text-xs h-8" onClick={() => applyPreset(p)}>
                <Wand2 className="mr-1.5 h-3 w-3" />
                {p.name}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setDeltaRev(0); setDeltaExp(0); }}>
              Resetar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Variação na receita mensal</Label>
            <Input
              type="number"
              value={deltaRev}
              onChange={(e) => setDeltaRev(Number(e.target.value))}
              placeholder="ex: +5000 ou -3000"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Use negativo para perda · positivo para ganho</p>
          </div>
          <div>
            <Label className="text-xs">Variação na despesa mensal</Label>
            <Input
              type="number"
              value={deltaExp}
              onChange={(e) => setDeltaExp(Number(e.target.value))}
              placeholder="ex: +8000 ou -2000"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Use negativo para corte · positivo para custo extra</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            {better ? <TrendingUp className="h-4 w-4 text-[hsl(142_71%_40%)]" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            <span className="text-xs font-semibold uppercase tracking-wider">Resultado projetado</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Novo MRR</p>
              <p className="text-base font-semibold tabular-nums">{formatBRL(result.newMRR)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nova despesa</p>
              <p className="text-base font-semibold tabular-nums">{formatBRL(result.newExp)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resultado/mês</p>
              <p className={`text-base font-semibold tabular-nums ${result.newResult >= 0 ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]" : "text-destructive"}`}>
                {formatBRL(result.newResult)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Runway</p>
              <p className={`text-base font-semibold tabular-nums ${result.newRunway > 6 ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]" : "text-destructive"}`}>
                {result.newRunway > 100 ? "∞" : `${result.newRunway} meses`}
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Caixa em 12 meses</span>
            <span className={`tabular-nums font-semibold ${result.cashIn12m >= 0 ? "text-foreground" : "text-destructive"}`}>
              {formatBRL(result.cashIn12m)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Impacto vs cenário atual</span>
            <span className={`tabular-nums font-semibold ${result.impactVsCurrent >= 0 ? "text-[hsl(142_71%_40%)] dark:text-[hsl(142_71%_55%)]" : "text-destructive"}`}>
              {result.impactVsCurrent >= 0 ? "+" : ""}{formatBRL(result.impactVsCurrent)}/mês
            </span>
          </div>
        </div>
      </div>
    </ExecCard>
  );
}
