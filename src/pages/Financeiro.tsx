import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, BarChart3, Calendar } from "lucide-react";
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Atmospheric ambient glows — adapt to light/dark via low opacity primary */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-[15%] w-[60%] h-[600px] rounded-full opacity-[0.08] dark:opacity-[0.12] blur-[160px]"
        style={{ background: "hsl(var(--primary))" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[5%] w-[45%] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.10] blur-[150px]"
        style={{ background: "hsl(var(--accent))" }}
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-12 space-y-10">
        {/* Header — editorial style */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Módulo Financeiro
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium tracking-tight text-foreground">
              Visão Executiva
            </h1>
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </header>

        {/* Tabs — minimalist border-bottom style */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto border-b border-border rounded-none gap-2 md:gap-8 overflow-x-auto">
            {[
              { v: "dashboard", icon: BarChart3, label: "Dashboard" },
              { v: "receitas", icon: TrendingUp, label: "Receitas" },
              { v: "despesas", icon: TrendingDown, label: "Despesas" },
              { v: "equipe", icon: Users, label: "Equipe" },
              { v: "fluxo", icon: Calendar, label: "Fluxo de Caixa" },
            ].map(({ v, icon: Icon, label }) => (
              <TabsTrigger
                key={v}
                value={v}
                className="
                  relative px-3 md:px-2 pb-4 pt-1 h-auto rounded-none bg-transparent
                  text-sm font-medium text-muted-foreground hover:text-foreground transition-colors
                  data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none
                  data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-0 data-[state=active]:after:right-0
                  data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary
                  data-[state=active]:after:shadow-[0_0_10px_hsl(var(--primary)/0.6)]
                  flex items-center gap-2 whitespace-nowrap shrink-0
                "
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 animate-in fade-in-50 duration-300 space-y-8">
            <CurrentMonthBar />
            <FinanceDashboard period={period} />
          </TabsContent>
          <TabsContent value="receitas" className="mt-0 animate-in fade-in-50 duration-300">
            <FinanceRevenues period={period} />
          </TabsContent>
          <TabsContent value="despesas" className="mt-0 animate-in fade-in-50 duration-300">
            <FinanceExpenses period={period} />
          </TabsContent>
          <TabsContent value="equipe" className="mt-0 animate-in fade-in-50 duration-300">
            <FinanceTeam period={period} />
          </TabsContent>
          <TabsContent value="fluxo" className="mt-0 animate-in fade-in-50 duration-300">
            <FinanceCashflow period={period} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
