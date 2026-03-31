import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Eye, MousePointerClick, Send, TrendingUp, Users, LogOut, CalendarIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  formId: string;
}

type PeriodPreset = "7d" | "30d" | "90d" | "all" | "custom";

export default function FormAnalytics({ formId }: Props) {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const { data: allEvents = [], isLoading } = useQuery({
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

  const { data: allSubmissions = [] } = useQuery({
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

  // Filter by period
  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === "7d") return { from: startOfDay(subDays(now, 7)), to: now };
    if (period === "30d") return { from: startOfDay(subDays(now, 30)), to: now };
    if (period === "90d") return { from: startOfDay(subDays(now, 90)), to: now };
    if (period === "custom" && customFrom) return { from: startOfDay(customFrom), to: customTo ? new Date(customTo.getTime() + 86400000 - 1) : now };
    return null; // all
  }, [period, customFrom, customTo]);

  const events = useMemo(() => {
    if (!dateRange) return allEvents;
    return allEvents.filter((e: any) => {
      const d = new Date(e.created_at);
      return isAfter(d, dateRange.from) && isBefore(d, dateRange.to);
    });
  }, [allEvents, dateRange]);

  const submissions = useMemo(() => {
    if (!dateRange) return allSubmissions;
    return allSubmissions.filter((s: any) => {
      const d = new Date(s.created_at);
      return isAfter(d, dateRange.from) && isBefore(d, dateRange.to);
    });
  }, [allSubmissions, dateRange]);

  const stats = useMemo(() => {
    const views = events.filter((e: any) => e.event_type === "view").length;
    const starts = events.filter((e: any) => e.event_type === "start").length;
    const submits = events.filter((e: any) => e.event_type === "submit").length;
    const abandons = events.filter((e: any) => e.event_type === "abandon").length;
    const uniqueSessions = new Set(events.map((e: any) => e.session_id).filter(Boolean)).size;

    return {
      views, starts, submits, abandons, uniqueSessions,
      startRate: views > 0 ? ((starts / views) * 100).toFixed(1) : "0",
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : "0",
      completionRate: starts > 0 ? ((submits / starts) * 100).toFixed(1) : "0",
      abandonRate: starts > 0 ? ((abandons / starts) * 100).toFixed(1) : "0",
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
    { name: "Abandonaram", value: stats.abandons, fill: "hsl(var(--destructive))" },
  ], [stats]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }));
    events.filter((e: any) => e.event_type === "submit").forEach((e: any) => {
      const h = new Date(e.created_at).getHours();
      hours[h].count++;
    });
    return hours;
  }, [events]);

  const abandonByField = useMemo(() => {
    const abandonEvents = events.filter((e: any) => e.event_type === "abandon" && e.metadata);
    const fieldMap: Record<string, { label: string; count: number }> = {};
    abandonEvents.forEach((e: any) => {
      const meta = typeof e.metadata === "object" ? e.metadata : {};
      const label = (meta as any).last_field_label || "Desconhecido";
      const id = (meta as any).last_field_id || label;
      if (!fieldMap[id]) fieldMap[id] = { label, count: 0 };
      fieldMap[id].count++;
    });
    return Object.values(fieldMap)
      .sort((a, b) => b.count - a.count)
      .map(item => ({ field: item.label, abandonos: item.count }));
  }, [events]);

  const fieldFunnel = useMemo(() => {
    const focusEvents = events.filter((e: any) => e.event_type === "field_focus" && e.metadata);
    const fieldSessions: Record<string, Set<string>> = {};
    const fieldOrder: string[] = [];

    focusEvents.forEach((e: any) => {
      const meta = typeof e.metadata === "object" ? e.metadata : {};
      const label = (meta as any).field_label || "?";
      const session = e.session_id || "?";
      if (!fieldSessions[label]) {
        fieldSessions[label] = new Set();
        fieldOrder.push(label);
      }
      fieldSessions[label].add(session);
    });

    const seen = new Set<string>();
    return fieldOrder
      .filter(label => { if (seen.has(label)) return false; seen.add(label); return true; })
      .map(label => ({
        field: label.length > 18 ? label.slice(0, 16) + "…" : label,
        sessoes: fieldSessions[label].size,
      }));
  }, [events]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!allEvents.length && !allSubmissions.length) {
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

  const presetButtons: { label: string; value: PeriodPreset }[] = [
    { label: "7 dias", value: "7d" },
    { label: "30 dias", value: "30d" },
    { label: "90 dias", value: "90d" },
    { label: "Todos", value: "all" },
  ];

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Período:</span>
          {presetButtons.map(btn => (
            <Button
              key={btn.value}
              variant={period === btn.value ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriod(btn.value)}
            >
              {btn.label}
            </Button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={period === "custom" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                {period === "custom" && customFrom
                  ? `${format(customFrom, "dd/MM", { locale: ptBR })} – ${customTo ? format(customTo, "dd/MM", { locale: ptBR }) : "hoje"}`
                  : "Personalizado"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={customFrom && customTo ? { from: customFrom, to: customTo } : customFrom ? { from: customFrom, to: undefined } : undefined}
                onSelect={(range) => {
                  setCustomFrom(range?.from);
                  setCustomTo(range?.to);
                  if (range?.from) setPeriod("custom");
                }}
                numberOfMonths={2}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {dateRange && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} – {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
            </span>
          )}
        </div>
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          <LogOut className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{stats.abandons}</p>
          <p className="text-xs text-muted-foreground">Abandonos</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-chart-4" />
          <p className="text-2xl font-bold">{stats.uniqueSessions}</p>
          <p className="text-xs text-muted-foreground">Visitantes únicos</p>
        </GlassCard>
      </div>

      {/* Conversion rates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <GlassCard className="p-4 text-center">
          <p className="text-xl font-bold text-destructive">{stats.abandonRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa de abandono</p>
        </GlassCard>
      </div>

      {/* Funnel Chart */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold mb-3">Funil de Conversão</h3>
        <div className="space-y-2">
          {funnelData.map((item) => {
            const maxVal = Math.max(...funnelData.map(d => d.value), 1);
            const pct = (item.value / maxVal) * 100;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-6 rounded-md bg-muted overflow-hidden">
                  <div className="h-full rounded-md transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Field Interaction Funnel */}
      {fieldFunnel.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-1">Funil por Campo</h3>
          <p className="text-xs text-muted-foreground mb-3">Sessões únicas que interagiram com cada campo</p>
          <ChartContainer config={{ sessoes: { label: "Sessões", color: "hsl(var(--chart-2))" } }} className="h-[220px] w-full">
            <BarChart data={fieldFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="field" type="category" width={120} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sessoes" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Sessões" />
            </BarChart>
          </ChartContainer>
        </GlassCard>
      )}

      {/* Abandonment by field */}
      {abandonByField.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-1">Abandono por Campo</h3>
          <p className="text-xs text-muted-foreground mb-3">Em qual campo o lead desistiu do formulário</p>
          <ChartContainer config={{ abandonos: { label: "Abandonos", color: "hsl(var(--destructive))" } }} className="h-[220px] w-full">
            <BarChart data={abandonByField} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="field" type="category" width={120} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="abandonos" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Abandonos" />
            </BarChart>
          </ChartContainer>
        </GlassCard>
      )}

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
