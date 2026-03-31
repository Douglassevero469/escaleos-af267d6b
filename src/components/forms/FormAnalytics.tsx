import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Eye, MousePointerClick, Send, TrendingUp, Users, LogOut, CalendarIcon, Clock, Percent, FileDown } from "lucide-react";
import html2pdf from "html2pdf.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  formId: string;
  formName?: string;
}

type PeriodPreset = "7d" | "30d" | "90d" | "all" | "custom";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--destructive))",
];

export default function FormAnalytics({ formId, formName }: Props) {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: [10, 8, 10, 8] as [number, number, number, number],
        filename: `analytics-${formName || formId.slice(0, 8)}-${format(new Date(), "dd-MM-yyyy")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] as any },
      };
      await html2pdf().set(opt).from(element).save();
    } finally {
      setExporting(false);
    }
  }, [formId, formName]);

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
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === "7d") return { from: startOfDay(subDays(now, 7)), to: now };
    if (period === "30d") return { from: startOfDay(subDays(now, 30)), to: now };
    if (period === "90d") return { from: startOfDay(subDays(now, 90)), to: now };
    if (period === "custom" && customFrom) return { from: startOfDay(customFrom), to: customTo ? new Date(customTo.getTime() + 86400000 - 1) : now };
    return null;
  }, [period, customFrom, customTo]);

  const filterByDate = (items: any[]) => {
    if (!dateRange) return items;
    return items.filter((e: any) => {
      const d = new Date(e.created_at);
      return isAfter(d, dateRange.from) && isBefore(d, dateRange.to);
    });
  };

  const events = useMemo(() => filterByDate(allEvents), [allEvents, dateRange]);
  const submissions = useMemo(() => filterByDate(allSubmissions), [allSubmissions, dateRange]);

  const stats = useMemo(() => {
    const views = events.filter((e: any) => e.event_type === "view").length;
    const starts = events.filter((e: any) => e.event_type === "start").length;
    const submits = events.filter((e: any) => e.event_type === "submit").length;
    const abandons = events.filter((e: any) => e.event_type === "abandon").length;
    const uniqueSessions = new Set(events.map((e: any) => e.session_id).filter(Boolean)).size;
    const completeCount = submissions.filter((s: any) => (s.status || "complete") === "complete").length;
    const incompleteCount = submissions.filter((s: any) => s.status === "incomplete").length;

    return {
      views, starts, submits, abandons, uniqueSessions, completeCount, incompleteCount,
      startRate: views > 0 ? ((starts / views) * 100).toFixed(1) : "0",
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : "0",
      completionRate: starts > 0 ? ((submits / starts) * 100).toFixed(1) : "0",
      abandonRate: starts > 0 ? ((abandons / starts) * 100).toFixed(1) : "0",
    };
  }, [events, submissions]);

  // Daily chart data
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

  // Conversion rate over time
  const conversionTrend = useMemo(() => {
    const dayMap: Record<string, { date: string; views: number; submits: number }> = {};
    events.forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!dayMap[day]) dayMap[day] = { date: day, views: 0, submits: 0 };
      if (e.event_type === "view") dayMap[day].views++;
      if (e.event_type === "submit") dayMap[day].submits++;
    });
    return Object.values(dayMap).slice(-30).map(d => ({
      ...d,
      taxa: d.views > 0 ? Number(((d.submits / d.views) * 100).toFixed(1)) : 0,
    }));
  }, [events]);

  // Funnel data
  const funnelData = useMemo(() => [
    { name: "Visualizações", value: stats.views, fill: "hsl(var(--primary))" },
    { name: "Iniciaram", value: stats.starts, fill: "hsl(var(--chart-2))" },
    { name: "Enviaram", value: stats.submits, fill: "hsl(var(--chart-3))" },
    { name: "Abandonaram", value: stats.abandons, fill: "hsl(var(--destructive))" },
  ], [stats]);

  // Hourly distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }));
    events.filter((e: any) => e.event_type === "submit").forEach((e: any) => {
      const h = new Date(e.created_at).getHours();
      hours[h].count++;
    });
    return hours;
  }, [events]);

  // Abandon by field
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
    return Object.values(fieldMap).sort((a, b) => b.count - a.count).map(item => ({ field: item.label, abandonos: item.count }));
  }, [events]);

  // Field funnel
  const fieldFunnel = useMemo(() => {
    const focusEvents = events.filter((e: any) => e.event_type === "field_focus" && e.metadata);
    const fieldSessions: Record<string, Set<string>> = {};
    const fieldOrder: string[] = [];
    focusEvents.forEach((e: any) => {
      const meta = typeof e.metadata === "object" ? e.metadata : {};
      const label = (meta as any).field_label || "?";
      const session = e.session_id || "?";
      if (!fieldSessions[label]) { fieldSessions[label] = new Set(); fieldOrder.push(label); }
      fieldSessions[label].add(session);
    });
    const seen = new Set<string>();
    return fieldOrder
      .filter(label => { if (seen.has(label)) return false; seen.add(label); return true; })
      .map(label => ({ field: label.length > 18 ? label.slice(0, 16) + "…" : label, sessoes: fieldSessions[label].size }));
  }, [events]);

  // Status pie data
  const statusPie = useMemo(() => {
    if (!submissions.length) return [];
    return [
      { name: "Completas", value: stats.completeCount, fill: "hsl(var(--chart-3))" },
      { name: "Incompletas", value: stats.incompleteCount, fill: "hsl(var(--destructive))" },
    ].filter(d => d.value > 0);
  }, [submissions, stats]);

  // Day of week distribution
  const dayOfWeekData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const counts = Array(7).fill(0);
    submissions.forEach((s: any) => {
      counts[new Date(s.created_at).getDay()]++;
    });
    return days.map((d, i) => ({ dia: d, respostas: counts[i] }));
  }, [submissions]);

  // Avg time between view and submit per session
  const avgCompletionTime = useMemo(() => {
    const sessionViews: Record<string, number> = {};
    const sessionSubmits: Record<string, number> = {};
    events.forEach((e: any) => {
      if (!e.session_id) return;
      const t = new Date(e.created_at).getTime();
      if (e.event_type === "view" && (!sessionViews[e.session_id] || t < sessionViews[e.session_id])) {
        sessionViews[e.session_id] = t;
      }
      if (e.event_type === "submit" && (!sessionSubmits[e.session_id] || t > sessionSubmits[e.session_id])) {
        sessionSubmits[e.session_id] = t;
      }
    });
    const diffs: number[] = [];
    Object.keys(sessionSubmits).forEach(sid => {
      if (sessionViews[sid]) diffs.push((sessionSubmits[sid] - sessionViews[sid]) / 1000);
    });
    if (!diffs.length) return null;
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (avg < 60) return `${Math.round(avg)}s`;
    if (avg < 3600) return `${Math.round(avg / 60)}min`;
    return `${(avg / 3600).toFixed(1)}h`;
  }, [events]);

  // Recent respondents table data
  const recentRespondents = useMemo(() => {
    return submissions.slice(0, 20).map((s: any) => {
      const data = typeof s.data === "object" && s.data ? s.data : {};
      const keys = Object.keys(data);
      const name = data["Nome"] || data["nome"] || data["name"] || data["Name"] || keys.length > 0 ? String(data[keys[0]] || "") : "";
      const email = data["Email"] || data["email"] || data["E-mail"] || data["e-mail"] || "";
      const phone = data["Telefone"] || data["telefone"] || data["phone"] || data["Phone"] || data["WhatsApp"] || data["whatsapp"] || "";
      const tags = (s.tags as string[]) || [];
      return {
        id: s.id,
        name: name || "—",
        email: email || "—",
        phone: phone || "—",
        status: s.status || "complete",
        tags,
        date: new Date(s.created_at).toLocaleString("pt-BR"),
        fieldsCount: keys.length,
      };
    });
  }, [submissions]);

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
            <Button key={btn.value} variant={period === btn.value ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setPeriod(btn.value)}>
              {btn.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={period === "custom" ? "default" : "outline"} size="sm" className="h-7 text-xs">
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
                onSelect={(range) => { setCustomFrom(range?.from); setCustomTo(range?.to); if (range?.from) setPeriod("custom"); }}
                numberOfMonths={2}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <span className="text-[10px] text-muted-foreground">
              {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} – {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
            </span>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs ml-auto" onClick={exportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileDown className="h-3 w-3 mr-1" />}
            Exportar PDF
          </Button>
        </div>
      </GlassCard>

      <div ref={reportRef} className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
        {avgCompletionTime && (
          <GlassCard className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-chart-5" />
            <p className="text-2xl font-bold">{avgCompletionTime}</p>
            <p className="text-xs text-muted-foreground">Tempo médio</p>
          </GlassCard>
        )}
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

      {/* Respondents Table */}
      {recentRespondents.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3">Últimos Respondentes</h3>
          <div className="overflow-auto max-h-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRespondents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium max-w-[140px] truncate">{r.name}</TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate">{r.email}</TableCell>
                    <TableCell className="text-sm">{r.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "complete" ? "default" : "secondary"}
                        className={r.status !== "complete" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : ""}
                      >
                        {r.status === "complete" ? "Completo" : "Incompleto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {r.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                        ))}
                        {r.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{r.tags.length - 2}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{r.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}

      {/* Two-column charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Funnel */}
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

        {/* Status Pie + Day of Week */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3">Status das Respostas</h3>
          {statusPie.length > 0 ? (
            <div className="flex items-center gap-4">
              <ChartContainer config={{ value: { label: "Respostas" } }} className="h-[160px] w-[160px]">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {statusPie.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="space-y-2">
                {statusPie.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs">{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {submissions.length} respostas
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhuma resposta no período</p>
          )}
        </GlassCard>
      </div>

      {/* Conversion rate trend */}
      {conversionTrend.length > 1 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3">Taxa de Conversão ao Longo do Tempo</h3>
          <ChartContainer config={{ taxa: { label: "Conversão %", color: "hsl(var(--primary))" } }} className="h-[200px] w-full">
            <AreaChart data={conversionTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} unit="%" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="taxa" stroke="hsl(var(--primary))" fill="url(#convGrad)" strokeWidth={2} name="Conversão %" />
            </AreaChart>
          </ChartContainer>
        </GlassCard>
      )}

      {/* Day of week */}
      {dayOfWeekData.some(d => d.respostas > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3">Respostas por Dia da Semana</h3>
            <ChartContainer config={{ respostas: { label: "Respostas", color: "hsl(var(--chart-2))" } }} className="h-[180px] w-full">
              <BarChart data={dayOfWeekData}>
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="respostas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Respostas" />
              </BarChart>
            </ChartContainer>
          </GlassCard>

          {/* Hourly */}
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
      )}

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
          <h3 className="text-sm font-semibold mb-3">Atividade por Dia</h3>
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
    </div>
  );
}
