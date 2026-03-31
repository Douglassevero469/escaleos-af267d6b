import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Eye, MousePointerClick, Send, TrendingUp, Users } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

interface Props {
  formId: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function FormAnalytics({ formId }: Props) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["form-events", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_events")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["form-submissions-analytics", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id, created_at")
        .eq("form_id", formId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const views = events.filter((e: any) => e.event_type === "view").length;
    const starts = events.filter((e: any) => e.event_type === "start").length;
    const submits = events.filter((e: any) => e.event_type === "submit").length;
    const uniqueSessions = new Set(events.map((e: any) => e.session_id).filter(Boolean)).size;

    return {
      views,
      starts,
      submits,
      uniqueSessions,
      startRate: views > 0 ? ((starts / views) * 100).toFixed(1) : "0",
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : "0",
      completionRate: starts > 0 ? ((submits / starts) * 100).toFixed(1) : "0",
    };
  }, [events]);

  const dailyData = useMemo(() => {
    const dayMap: Record<string, { date: string; views: number; starts: number; submits: number }> = {};

    events.forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!dayMap[day]) dayMap[day] = { date: day, views: 0, starts: 0, submits: 0 };
      if (e.event_type === "view") dayMap[day].views++;
      if (e.event_type === "start") dayMap[day].starts++;
      if (e.event_type === "submit") dayMap[day].submits++;
    });

    return Object.values(dayMap).slice(-30);
  }, [events]);

  const funnelData = useMemo(() => [
    { name: "Visualizações", value: stats.views, fill: "hsl(var(--primary))" },
    { name: "Iniciaram", value: stats.starts, fill: "hsl(var(--chart-2))" },
    { name: "Enviaram", value: stats.submits, fill: "hsl(var(--chart-3))" },
  ], [stats]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }));
    events.filter((e: any) => e.event_type === "submit").forEach((e: any) => {
      const h = new Date(e.created_at).getHours();
      hours[h].count++;
    });
    return hours;
  }, [events]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!events.length && !submissions.length) {
    return (
      <GlassCard className="flex flex-col items-center py-16 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum dado de analytics ainda</p>
        <p className="text-xs text-muted-foreground mt-1">Os dados começarão a aparecer quando leads acessarem o formulário</p>
      </GlassCard>
    );
  }

  const chartConfig = {
    views: { label: "Visualizações", color: "hsl(var(--primary))" },
    starts: { label: "Iniciaram", color: "hsl(var(--chart-2))" },
    submits: { label: "Enviaram", color: "hsl(var(--chart-3))" },
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="p-4 text-center">
          <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{stats.views}</p>
          <p className="text-xs text-muted-foreground">Visualizações</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <MousePointerClick className="h-5 w-5 mx-auto mb-1 text-chart-2" />
          <p className="text-2xl font-bold">{stats.starts}</p>
          <p className="text-xs text-muted-foreground">Iniciaram</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Send className="h-5 w-5 mx-auto mb-1 text-chart-3" />
          <p className="text-2xl font-bold">{stats.submits}</p>
          <p className="text-xs text-muted-foreground">Enviaram</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-chart-4" />
          <p className="text-2xl font-bold">{stats.uniqueSessions}</p>
          <p className="text-xs text-muted-foreground">Visitantes únicos</p>
        </GlassCard>
      </div>

      {/* Conversion rates */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center">
          <p className="text-xl font-bold text-primary">{stats.startRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa de início</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xl font-bold text-primary">{stats.completionRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa de conclusão</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xl font-bold text-primary">{stats.conversionRate}%</p>
          <p className="text-xs text-muted-foreground">Conversão total</p>
        </GlassCard>
      </div>

      {/* Funnel Chart */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold mb-3">Funil de Conversão</h3>
        <div className="space-y-2">
          {funnelData.map((item, i) => {
            const maxVal = Math.max(...funnelData.map(d => d.value), 1);
            const pct = (item.value / maxVal) * 100;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-6 rounded-md bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Daily Chart */}
      {dailyData.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3">Submissões por Dia</h3>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Visualizações" />
              <Bar dataKey="starts" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Iniciaram" />
              <Bar dataKey="submits" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Enviaram" />
            </BarChart>
          </ChartContainer>
        </GlassCard>
      )}

      {/* Hourly distribution */}
      {hourlyData.some(h => h.count > 0) && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3">Horário das Submissões</h3>
          <ChartContainer config={{ count: { label: "Submissões", color: "hsl(var(--primary))" } }} className="h-[180px] w-full">
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Submissões" />
            </BarChart>
          </ChartContainer>
        </GlassCard>
      )}
    </div>
  );
}
