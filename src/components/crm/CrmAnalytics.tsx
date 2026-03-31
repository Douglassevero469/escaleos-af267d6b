import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import type { CrmLead } from "./LeadCard";
import type { StageDef } from "./KanbanStageColumn";

interface Props {
  leads: CrmLead[];
  stages: StageDef[];
}

export function CrmAnalytics({ leads, stages }: Props) {
  const totalValue = useMemo(() => leads.reduce((s, l) => s + Number(l.value || 0), 0), [leads]);
  const avgScore = useMemo(() => {
    const scored = leads.filter(l => l.score > 0);
    return scored.length ? Math.round(scored.reduce((s, l) => s + l.score, 0) / scored.length) : 0;
  }, [leads]);

  const byStage = useMemo(() => {
    return stages.map(s => {
      const stageLeads = leads.filter(l => l.stage === s.id);
      return {
        name: s.name,
        color: s.color,
        leads: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + Number(l.value || 0), 0),
      };
    });
  }, [leads, stages]);

  const byForm = useMemo(() => {
    const map: Record<string, { count: number; id: string }> = {};
    leads.forEach(l => {
      const key = l.form_id || "manual";
      if (!map[key]) map[key] = { count: 0, id: key };
      map[key].count++;
    });
    return Object.entries(map)
      .map(([key, v]) => ({ name: key === "manual" ? "Manual" : "Formulário", ...v }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const conversionData = useMemo(() => {
    if (stages.length < 2) return [];
    return stages.slice(0, -1).map((s, i) => {
      const current = leads.filter(l => {
        const idx = stages.findIndex(st => st.id === l.stage);
        return idx >= i;
      }).length;
      const next = leads.filter(l => {
        const idx = stages.findIndex(st => st.id === l.stage);
        return idx >= i + 1;
      }).length;
      const rate = current > 0 ? Math.round((next / current) * 100) : 0;
      return { name: `${s.name} → ${stages[i + 1].name}`, rate, color: s.color };
    });
  }, [leads, stages]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <p className="text-xl font-bold">{leads.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold">{totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score Médio</p>
              <p className="text-xl font-bold">{avgScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Via Formulário</p>
              <p className="text-xl font-bold">{leads.filter(l => l.form_id).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Leads por Etapa */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Leads por Etapa</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStage} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [v, "Leads"]} />
                <Bar dataKey="leads" radius={[0, 6, 6, 0]}>
                  {byStage.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Taxa de Conversão</CardTitle></CardHeader>
          <CardContent>
            {conversionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={conversionData} margin={{ left: 0, right: 16 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis unit="%" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Conversão"]} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {conversionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Dados insuficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Valor por Etapa */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Valor por Etapa (R$)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStage.filter(s => s.value > 0)} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Valor"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byStage.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Origem dos Leads */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Origem dos Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byForm} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {byForm.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
