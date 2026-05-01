import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, TrendingDown, Users, BarChart3, Calendar } from "lucide-react";
import { FinanceDashboard } from "@/components/financeiro/FinanceDashboard";
import { FinanceRevenues } from "@/components/financeiro/FinanceRevenues";
import { FinanceExpenses } from "@/components/financeiro/FinanceExpenses";
import { FinanceTeam } from "@/components/financeiro/FinanceTeam";
import { FinanceCashflow } from "@/components/financeiro/FinanceCashflow";
import { PeriodFilter, buildPeriod, Period } from "@/components/financeiro/PeriodFilter";
import { CurrentMonthBar } from "@/components/financeiro/CurrentMonthBar";

export default function Financeiro() {
  const [tab, setTab] = useState("dashboard");
  const [period, setPeriod] = useState<Period>(() => buildPeriod("month", new Date()));

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              BI completo, receitas, despesas, equipe e fluxo de caixa
            </p>
          </div>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1 gap-1">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs md:text-sm">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="receitas" className="gap-1.5 text-xs md:text-sm">
            <TrendingUp className="h-4 w-4" /> Receitas
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-1.5 text-xs md:text-sm">
            <TrendingDown className="h-4 w-4" /> Despesas
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5 text-xs md:text-sm">
            <Users className="h-4 w-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="fluxo" className="gap-1.5 text-xs md:text-sm">
            <Calendar className="h-4 w-4" /> Fluxo
          </TabsTrigger>
        </TabsList>

        <CurrentMonthBar />

        <TabsContent value="dashboard" className="mt-0"><FinanceDashboard period={period} /></TabsContent>
        <TabsContent value="receitas" className="mt-0"><FinanceRevenues period={period} /></TabsContent>
        <TabsContent value="despesas" className="mt-0"><FinanceExpenses period={period} /></TabsContent>
        <TabsContent value="equipe" className="mt-0"><FinanceTeam period={period} /></TabsContent>
        <TabsContent value="fluxo" className="mt-0"><FinanceCashflow period={period} /></TabsContent>
      </Tabs>
    </div>
  );
}
