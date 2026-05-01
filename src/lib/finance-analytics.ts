/**
 * Shared analytics helpers for the Financeiro module.
 * Pure functions — no I/O, easy to test.
 */

export interface DREInput {
  mrr: number;
  taxRate?: number; // % impostos sobre receita
  teamCost: number;
  fixedExp: number;
  marketingExp?: number;
}

export function computeDRE(input: DREInput) {
  const grossRevenue = input.mrr;
  const taxes = grossRevenue * ((input.taxRate ?? 8) / 100); // padrão 8% (simples nacional aprox)
  const netRevenue = grossRevenue - taxes;
  const directCost = input.teamCost; // folha como custo direto (agência)
  const grossMargin = netRevenue - directCost;
  const operatingExp = input.fixedExp;
  const marketingExp = input.marketingExp ?? 0;
  const ebitda = grossMargin - operatingExp - marketingExp;
  const result = ebitda; // simplificado

  return [
    { label: "Receita Bruta", value: grossRevenue, type: "header" as const },
    { label: "(–) Impostos sobre Receita", value: -taxes, type: "deduction" as const },
    { label: "Receita Líquida", value: netRevenue, type: "subtotal" as const },
    { label: "(–) Custo Direto (Folha)", value: -directCost, type: "deduction" as const },
    { label: "Margem Bruta", value: grossMargin, type: "subtotal" as const, percent: grossRevenue ? (grossMargin / grossRevenue) * 100 : 0 },
    { label: "(–) Despesas Operacionais", value: -operatingExp, type: "deduction" as const },
    { label: "(–) Marketing/Tráfego", value: -marketingExp, type: "deduction" as const },
    { label: "EBITDA", value: ebitda, type: "total" as const, percent: grossRevenue ? (ebitda / grossRevenue) * 100 : 0 },
    { label: "Resultado Líquido", value: result, type: "total" as const, percent: grossRevenue ? (result / grossRevenue) * 100 : 0 },
  ];
}

/** Build daily cashflow heatmap data (calendar) for a given month. */
export function buildCashflowHeatmap(transactions: any[], year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map = new Map<string, { in: number; out: number; net: number; count: number }>();

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    map.set(key, { in: 0, out: 0, net: 0, count: 0 });
  }

  transactions.forEach((t) => {
    if (!t.due_date) return;
    const cell = map.get(t.due_date);
    if (!cell) return;
    const amt = Number(t.amount);
    if (t.kind === "income") cell.in += amt;
    else cell.out += amt;
    cell.net = cell.in - cell.out;
    cell.count += 1;
  });

  return Array.from(map.entries()).map(([date, data]) => ({ date, ...data }));
}

/** Run a what-if scenario over current snapshot. */
export interface ScenarioInput {
  baseMRR: number;
  baseExp: number;
  baseCash: number;
  deltaRevenue?: number; // R$ extra/mês
  deltaExpense?: number; // R$ extra/mês
  monthsHorizon?: number;
}

export function runScenario(input: ScenarioInput) {
  const months = input.monthsHorizon ?? 12;
  const newMRR = input.baseMRR + (input.deltaRevenue ?? 0);
  const newExp = input.baseExp + (input.deltaExpense ?? 0);
  const newResult = newMRR - newExp;
  const newRunway = newResult < 0 ? Math.max(0, Math.floor(input.baseCash / Math.abs(newResult))) : 999;
  const cashIn12m = input.baseCash + newResult * months;

  return {
    newMRR,
    newExp,
    newResult,
    newRunway,
    cashIn12m,
    impactVsCurrent: newResult - (input.baseMRR - input.baseExp),
  };
}

/** Compare current vs previous period. */
export function compareWithPrevious(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/** Apply annual adjustment to a recurring revenue. */
export const ADJUSTMENT_INDEX_RATES: Record<string, number> = {
  none: 0,
  ipca: 4.5, // estimated yearly
  igpm: 6.0,
  custom: 5.0,
};

export function shouldApplyAdjustment(lastDate: string | null, startDate: string | null): boolean {
  const ref = lastDate || startDate;
  if (!ref) return false;
  const d = new Date(ref);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return monthsDiff >= 12;
}
