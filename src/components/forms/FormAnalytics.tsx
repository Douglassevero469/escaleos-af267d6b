import { useState, useMemo, useRef, useCallback, lazy, Suspense } from "react";
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
import { Loader2, Eye, MousePointerClick, Send, TrendingUp, Users, LogOut, CalendarIcon, Clock, Percent, FileDown, FileText, Columns, Settings2, X, Plus, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { exportAnalyticsPDF, captureChartAsImage } from "@/lib/analytics-pdf-export";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FormField } from "@/lib/form-field-types";

const LocationHeatmap = lazy(() => import("@/components/forms/LocationHeatmap"));

interface Props {
  formId: string;
  formName?: string;
  formFields?: FormField[];
}

type PeriodPreset = "7d" | "30d" | "90d" | "all" | "custom";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--destructive))",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
];

// Built-in chart IDs
type BuiltInChart =
  | "kpis"
  | "rates"
  | "respondents"
  | "funnel"
  | "statusPie"
  | "conversionTrend"
  | "dayOfWeek"
  | "hourly"
  | "fieldFunnel"
  | "abandonByField"
  | "dailyActivity"
  | "deviceType"
  | "browser"
  | "deviceModel"
  | "region"
  | "locationMap";

const BUILTIN_CHART_LABELS: Record<BuiltInChart, string> = {
  kpis: "KPIs Principais",
  rates: "Taxas de Conversão",
  respondents: "Tabela de Respondentes",
  funnel: "Funil de Conversão",
  statusPie: "Status das Respostas",
  conversionTrend: "Taxa de Conversão no Tempo",
  dayOfWeek: "Respostas por Dia da Semana",
  hourly: "Horário das Submissões",
  fieldFunnel: "Funil por Campo",
  abandonByField: "Abandono por Campo",
  dailyActivity: "Atividade por Dia",
  deviceType: "Tipo de Dispositivo",
  browser: "Navegador",
  deviceModel: "Modelo / Sistema Operacional",
  region: "Respostas por Região",
  locationMap: "Mapa de Calor de Localização",
};

const ALL_BUILTIN_CHARTS = Object.keys(BUILTIN_CHART_LABELS) as BuiltInChart[];

export default function FormAnalytics({ formId, formName, formFields = [] }: Props) {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [exporting, setExporting] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("portrait");
  const chartsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Visibility state
  const [visibleCharts, setVisibleCharts] = useState<Set<string>>(() => new Set(ALL_BUILTIN_CHARTS));
  const [activeFieldCharts, setActiveFieldCharts] = useState<Set<string>>(new Set());

  const toggleChart = (id: string) => {
    setVisibleCharts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFieldChart = (fieldId: string) => {
    setActiveFieldCharts(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) { next.delete(fieldId); setVisibleCharts(p => { const n = new Set(p); n.delete(`field_${fieldId}`); return n; }); }
      else { next.add(fieldId); setVisibleCharts(p => new Set(p).add(`field_${fieldId}`)); }
      return next;
    });
  };

  const isVisible = (id: string) => visibleCharts.has(id);

  // Chartable form fields (selection types with options)
  const chartableFields = useMemo(() => {
    const selectionTypes = ["select", "radio", "radio_cards", "checkbox", "selection", "image_choice", "yes_no", "switch", "rating"];
    return formFields.filter(f => selectionTypes.includes(f.type) && f.label);
  }, [formFields]);

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

  const statusPie = useMemo(() => {
    if (!submissions.length) return [];
    return [
      { name: "Completas", value: stats.completeCount, fill: "hsl(var(--primary))" },
      { name: "Incompletas", value: stats.incompleteCount, fill: "hsl(var(--destructive))" },
    ].filter(d => d.value > 0);
  }, [stats, submissions]);

  const conversionTrend = useMemo(() => {
    const dayMap: Record<string, { views: number; submits: number }> = {};
    events.forEach((e: any) => {
      const day = format(new Date(e.created_at), "dd/MM");
      if (!dayMap[day]) dayMap[day] = { views: 0, submits: 0 };
      if (e.event_type === "view") dayMap[day].views++;
      if (e.event_type === "submit") dayMap[day].submits++;
    });
    return Object.entries(dayMap).map(([date, d]) => ({
      date,
      taxa: d.views > 0 ? Math.round((d.submits / d.views) * 100) : 0,
    }));
  }, [events]);

  const dayOfWeekData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    submissions.forEach((s: any) => { counts[new Date(s.created_at).getDay()]++; });
    return days.map((dia, i) => ({ dia, respostas: counts[i] }));
  }, [submissions]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }));
    submissions.forEach((s: any) => { hours[new Date(s.created_at).getHours()].count++; });
    return hours;
  }, [submissions]);

  const fieldFunnel = useMemo(() => {
    const fieldFocusEvents = events.filter((e: any) => e.event_type === "field_focus");
    const fieldMap: Record<string, Set<string>> = {};
    fieldFocusEvents.forEach((e: any) => {
      const label = e.metadata?.field_label || e.metadata?.field_id;
      const session = e.session_id;
      if (label && session) {
        if (!fieldMap[label]) fieldMap[label] = new Set();
        fieldMap[label].add(session);
      }
    });
    return Object.entries(fieldMap)
      .map(([field, sessions]) => ({ field, sessoes: sessions.size }))
      .sort((a, b) => b.sessoes - a.sessoes);
  }, [events]);

  const abandonByField = useMemo(() => {
    const abandonEvents = events.filter((e: any) => e.event_type === "abandon");
    const fieldMap: Record<string, number> = {};
    abandonEvents.forEach((e: any) => {
      const label = e.metadata?.last_field_label || e.metadata?.last_field_id || "Desconhecido";
      fieldMap[label] = (fieldMap[label] || 0) + 1;
    });
    return Object.entries(fieldMap)
      .map(([field, abandonos]) => ({ field, abandonos }))
      .sort((a, b) => b.abandonos - a.abandonos);
  }, [events]);

  const avgCompletionTime = useMemo(() => {
    const sessionTimes: Record<string, { start?: number; submit?: number }> = {};
    events.forEach((e: any) => {
      if (!e.session_id) return;
      if (!sessionTimes[e.session_id]) sessionTimes[e.session_id] = {};
      const t = new Date(e.created_at).getTime();
      if (e.event_type === "start") sessionTimes[e.session_id].start = t;
      if (e.event_type === "submit") sessionTimes[e.session_id].submit = t;
    });
    const durations = Object.values(sessionTimes)
      .filter(s => s.start && s.submit)
      .map(s => (s.submit! - s.start!) / 1000);
    if (!durations.length) return null;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    if (avg < 60) return `${Math.round(avg)}s`;
    return `${Math.floor(avg / 60)}m ${Math.round(avg % 60)}s`;
  }, [events]);

  const recentRespondents = useMemo(() => {
    return submissions.slice(0, 20).map((s: any) => {
      const d = typeof s.data === "object" && s.data ? s.data : {};
      const keys = Object.keys(d);
      const name = d["Nome"] || d["nome"] || d["Name"] || d["name"] || keys[0] ? d[keys[0]] : "—";
      const email = d["Email"] || d["email"] || d["E-mail"] || "—";
      const phone = d["Telefone"] || d["telefone"] || d["Phone"] || d["phone"] || d["Whatsapp"] || d["whatsapp"] || "—";
      const rawTags: string[] = Array.isArray(s.tags) ? s.tags : [];
      const tags = rawTags.map((t: any) => typeof t === "string" ? (t.startsWith("{") ? JSON.parse(t)?.text || t : t) : t?.text || String(t));
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

  // Device & Geo analytics from metadata
  const deviceData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};

    submissions.forEach((s: any) => {
      const meta = (typeof s.metadata === "object" && s.metadata) ? s.metadata : {};
      const dt = meta.deviceType || "Desconhecido";
      const model = meta.model || meta.os || "Desconhecido";
      const browser = meta.browser || "Desconhecido";
      const city = meta.city;
      const region = city && meta.region ? `${city}, ${meta.region}` : city || meta.region || meta.country || null;

      typeCounts[dt] = (typeCounts[dt] || 0) + 1;
      modelCounts[model] = (modelCounts[model] || 0) + 1;
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      if (region) regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    return {
      deviceTypes: Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      models: Object.entries(modelCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10),
      browsers: Object.entries(browserCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      regions: Object.entries(regionCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10),
    };
  }, [submissions]);

  // Dynamic field response charts
  const fieldResponseCharts = useMemo(() => {
    const results: Record<string, { name: string; value: number }[]> = {};

    activeFieldCharts.forEach(fieldId => {
      const field = formFields.find(f => f.id === fieldId);
      if (!field) return;
      const counts: Record<string, number> = {};

      submissions.forEach((s: any) => {
        const d = typeof s.data === "object" && s.data ? s.data : {};
        const val = d[field.label];
        if (val === undefined || val === null || val === "") return;

        if (Array.isArray(val)) {
          val.forEach(v => { const sv = String(v); counts[sv] = (counts[sv] || 0) + 1; });
        } else {
          const sv = String(val);
          counts[sv] = (counts[sv] || 0) + 1;
        }
      });

      results[fieldId] = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    });

    return results;
  }, [activeFieldCharts, submissions, formFields]);

  const exportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const chartImages: { title: string; subtitle?: string; imageDataUrl: string }[] = [];
      if (chartsRef.current) {
        const chartSections = chartsRef.current.querySelectorAll("[data-chart-section]");
        for (const section of chartSections) {
          const title = section.getAttribute("data-chart-title") || "Gráfico";
          const subtitle = section.getAttribute("data-chart-subtitle") || undefined;
          const chartEl = section.querySelector(".recharts-responsive-container, [data-chart]") as HTMLElement;
          if (chartEl) {
            try {
              const imageDataUrl = await captureChartAsImage(chartEl.parentElement || chartEl);
              chartImages.push({ title, subtitle, imageDataUrl });
            } catch { /* skip */ }
          }
        }
      }

      const periodLabel = dateRange
        ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
        : "Todo o período";

      await exportAnalyticsPDF({
        formName: formName || "Formulário",
        periodLabel,
        exportDate: format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        kpis: [
          { label: "Visualizações", value: stats.views, icon: "eye", color: "#0000FF" },
          { label: "Iniciaram", value: stats.starts, icon: "click", color: "#22c55e" },
          { label: "Enviaram", value: stats.submits, icon: "send", color: "#3b82f6" },
          { label: "Abandonos", value: stats.abandons, icon: "logout", color: "#ef4444" },
          { label: "Visitantes únicos", value: stats.uniqueSessions, icon: "users", color: "#8b5cf6" },
          ...(avgCompletionTime ? [{ label: "Tempo médio", value: avgCompletionTime, icon: "clock", color: "#06b6d4" }] : []),
        ],
        rates: [
          { label: "Taxa de início", value: `${stats.startRate}%`, icon: "percent", color: "#0000FF" },
          { label: "Taxa de conclusão", value: `${stats.completionRate}%`, icon: "percent", color: "#0000FF" },
          { label: "Conversão total", value: `${stats.conversionRate}%`, icon: "trending", color: "#0000FF" },
          { label: "Taxa de abandono", value: `${stats.abandonRate}%`, icon: "percent", color: "#ef4444" },
        ],
        respondents: recentRespondents.map(r => ({
          name: r.name, email: r.email, phone: r.phone, status: r.status, date: r.date,
        })),
        chartImages,
        orientation: pdfOrientation,
      });
      toast({ title: "PDF exportado com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao exportar", description: "Tente novamente", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [formId, formName, dateRange, stats, avgCompletionTime, recentRespondents, toast, pdfOrientation]);

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
      {/* Period filter + settings */}
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
          <div className="flex items-center gap-2 ml-auto">
            {/* Settings Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Personalizar
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[360px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Personalizar Dashboard
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Built-in charts */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-foreground">Gráficos do Sistema</h4>
                    <div className="space-y-2">
                      {ALL_BUILTIN_CHARTS.map(id => (
                        <label key={id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer">
                          <span className="text-sm">{BUILTIN_CHART_LABELS[id]}</span>
                          <Switch
                            checked={isVisible(id)}
                            onCheckedChange={() => toggleChart(id)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Field response charts */}
                  {chartableFields.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Gráficos por Resposta</h4>
                      <p className="text-xs text-muted-foreground mb-3">Adicione gráficos baseados nas respostas dos campos do formulário</p>
                      <div className="space-y-2">
                        {chartableFields.map(field => (
                          <label key={field.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm block truncate">{field.label}</span>
                              <span className="text-[10px] text-muted-foreground">{field.type} {field.options ? `• ${field.options.length} opções` : ""}</span>
                            </div>
                            <Switch
                              checked={activeFieldCharts.has(field.id)}
                              onCheckedChange={() => toggleFieldChart(field.id)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setVisibleCharts(new Set(ALL_BUILTIN_CHARTS))}>
                      Mostrar todos
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setVisibleCharts(new Set(["kpis", "rates"]))}>
                      Apenas KPIs
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as "portrait" | "landscape")}>
              <SelectTrigger className="h-7 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Retrato</span>
                </SelectItem>
                <SelectItem value="landscape">
                  <span className="flex items-center gap-1"><Columns className="h-3 w-3" /> Paisagem</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportPDF} disabled={exporting}>
              {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileDown className="h-3 w-3 mr-1" />}
              Exportar PDF
            </Button>
          </div>
        </div>
      </GlassCard>

      <div ref={chartsRef} className="space-y-4">
      {/* KPI Cards */}
      {isVisible("kpis") && (
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
      )}

      {/* Conversion rates */}
      {isVisible("rates") && (
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
      )}

      {/* Respondents Table */}
      {isVisible("respondents") && recentRespondents.length > 0 && (
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
        {isVisible("funnel") && (
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
        )}

        {isVisible("statusPie") && (
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
                <p className="text-xs text-muted-foreground mt-1">Total: {submissions.length} respostas</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhuma resposta no período</p>
          )}
        </GlassCard>
        )}
      </div>

      {/* Conversion rate trend */}
      {isVisible("conversionTrend") && conversionTrend.length > 1 && (
        <GlassCard className="p-4" data-chart-section data-chart-title="Taxa de Conversão ao Longo do Tempo">
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

      {/* Day of week + Hourly */}
      {(isVisible("dayOfWeek") || isVisible("hourly")) && dayOfWeekData.some(d => d.respostas > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {isVisible("dayOfWeek") && (
          <GlassCard className="p-4" data-chart-section data-chart-title="Respostas por Dia da Semana">
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
          )}

          {isVisible("hourly") && hourlyData.some(h => h.count > 0) && (
          <GlassCard className="p-4" data-chart-section data-chart-title="Horário das Submissões">
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
      {isVisible("fieldFunnel") && fieldFunnel.length > 0 && (
        <GlassCard className="p-4" data-chart-section data-chart-title="Funil por Campo" data-chart-subtitle="Sessões únicas que interagiram com cada campo">
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
      {isVisible("abandonByField") && abandonByField.length > 0 && (
        <GlassCard className="p-4" data-chart-section data-chart-title="Abandono por Campo" data-chart-subtitle="Em qual campo o lead desistiu do formulário">
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
      {isVisible("dailyActivity") && dailyData.length > 0 && (
        <GlassCard className="p-4" data-chart-section data-chart-title="Atividade por Dia">
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

      {/* Device, Browser, Region Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("deviceType") && deviceData.deviceTypes.length > 0 && (
          <GlassCard className="p-4" data-chart-section data-chart-title="Tipo de Dispositivo">
            <h3 className="text-sm font-semibold mb-3">Tipo de Dispositivo</h3>
            <ChartContainer config={{ device: { label: "Dispositivo", color: "hsl(var(--primary))" } }} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={deviceData.deviceTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {deviceData.deviceTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </GlassCard>
        )}

        {isVisible("browser") && deviceData.browsers.length > 0 && (
          <GlassCard className="p-4" data-chart-section data-chart-title="Navegador">
            <h3 className="text-sm font-semibold mb-3">Navegador</h3>
            <ChartContainer config={{ browser: { label: "Navegador", color: "hsl(var(--chart-2))" } }} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={deviceData.browsers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {deviceData.browsers.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </GlassCard>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("deviceModel") && deviceData.models.length > 0 && (
          <GlassCard className="p-4" data-chart-section data-chart-title="Modelo / Sistema Operacional">
            <h3 className="text-sm font-semibold mb-3">Modelo / Sistema Operacional</h3>
            <ChartContainer config={{ model: { label: "Modelo", color: "hsl(var(--chart-3))" } }} className="h-[220px] w-full">
              <BarChart data={deviceData.models} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Respostas" />
              </BarChart>
            </ChartContainer>
          </GlassCard>
        )}

        {isVisible("region") && deviceData.regions.length > 0 && (
          <GlassCard className="p-4" data-chart-section data-chart-title="Respostas por Região">
            <h3 className="text-sm font-semibold mb-3">Respostas por Região</h3>
            <ChartContainer config={{ region: { label: "Região", color: "hsl(var(--chart-4))" } }} className="h-[220px] w-full">
              <BarChart data={deviceData.regions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="Respostas" />
              </BarChart>
            </ChartContainer>
          </GlassCard>
        )}
      </div>

      {/* Dynamic Field Response Charts */}
      {Object.entries(fieldResponseCharts).map(([fieldId, chartData]) => {
        const field = formFields.find(f => f.id === fieldId);
        if (!field || !isVisible(`field_${fieldId}`) || chartData.length === 0) return null;

        const usesPie = chartData.length <= 6;

        return (
          <GlassCard key={fieldId} className="p-4" data-chart-section data-chart-title={`Respostas: ${field.label}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {field.label}
                </h3>
                <p className="text-[10px] text-muted-foreground">Distribuição das respostas • {chartData.reduce((s, d) => s + d.value, 0)} total</p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleFieldChart(fieldId)}>
                <X className="h-3 w-3" />
              </Button>
            </div>

            {usesPie ? (
              <ChartContainer config={{ value: { label: "Respostas", color: "hsl(var(--primary))" } }} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={35} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={{ value: { label: "Respostas", color: "hsl(var(--primary))" } }} className="h-[220px] w-full">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Respostas" />
                </BarChart>
              </ChartContainer>
            )}
          </GlassCard>
        );
      })}
      </div>
    </div>
  );
}
