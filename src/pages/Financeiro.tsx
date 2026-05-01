import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, TrendingDown, Users, BarChart3, Calendar } from "lucide-react";
import { FinanceDashboard } from "@/components/financeiro/FinanceDashboard";
import { FinanceRevenues } from "@/components/financeiro/FinanceRevenues";
import { FinanceExpenses } from "@/components/financeiro/FinanceExpenses";
import { FinanceTeam } from "@/components/financeiro/FinanceTeam";
import { FinanceCashflow } from "@/components/financeiro/FinanceCashflow";

export default function Financeiro() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            BI completo, receitas, despesas, equipe e fluxo de caixa
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="receitas" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> Receitas
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-1.5">
            <TrendingDown className="h-4 w-4" /> Despesas
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5">
            <Users className="h-4 w-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="fluxo" className="gap-1.5">
            <Calendar className="h-4 w-4" /> Fluxo de Caixa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><FinanceDashboard /></TabsContent>
        <TabsContent value="receitas"><FinanceRevenues /></TabsContent>
        <TabsContent value="despesas"><FinanceExpenses /></TabsContent>
        <TabsContent value="equipe"><FinanceTeam /></TabsContent>
        <TabsContent value="fluxo"><FinanceCashflow /></TabsContent>
      </Tabs>
    </div>
  );
}
