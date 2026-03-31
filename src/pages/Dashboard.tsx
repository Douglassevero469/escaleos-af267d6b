import { StatsCard } from "@/components/ui/StatsCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, FileText, Package, LayoutTemplate, ArrowUpRight, Loader2, Zap, RefreshCw, Brain, DollarSign, KanbanSquare, ClipboardList, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { data: clientCount = 0 } = useQuery({
    queryKey: ["stats-clients"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: packageCount = 0 } = useQuery({
    queryKey: ["stats-packages"],
    queryFn: async () => {
      const { count } = await supabase.from("packages").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: docCount = 0 } = useQuery({
    queryKey: ["stats-documents"],
    queryFn: async () => {
      const { count } = await supabase.from("documents").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: templateCount = 0 } = useQuery({
    queryKey: ["stats-templates"],
    queryFn: async () => {
      const { count } = await supabase.from("templates").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: formCount = 0 } = useQuery({
    queryKey: ["stats-forms"],
    queryFn: async () => {
      const { count } = await supabase.from("forms").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: demandStats = { total: 0, byStatus: [] as { name: string; value: number; color: string }[], overdue: 0 } } = useQuery({
    queryKey: ["stats-demands"],
    queryFn: async () => {
      const { data: boards } = await supabase.from("demand_boards").select("columns");
      const { data: items } = await supabase.from("demand_items").select("status, due_date");
      if (!items) return { total: 0, byStatus: [], overdue: 0 };

      // Build column color map
      const colMap: Record<string, { name: string; color: string }> = {};
      (boards || []).forEach((b: any) => {
        ((b.columns as any[]) || []).forEach((c: any) => {
          if (!colMap[c.id]) colMap[c.id] = { name: c.name, color: c.color };
        });
      });

      const statusCount: Record<string, number> = {};
      let overdue = 0;
      const today = new Date().toISOString().slice(0, 10);
      items.forEach(i => {
        statusCount[i.status] = (statusCount[i.status] || 0) + 1;
        if (i.due_date && i.due_date < today && i.status !== "done") overdue++;
      });

      const byStatus = Object.entries(statusCount).map(([id, value]) => ({
        name: colMap[id]?.name || id,
        value,
        color: colMap[id]?.color || "#6b7280",
      }));

      return { total: items.length, byStatus, overdue };
    },
  });

  const { data: weeklyDemands = [] } = useQuery({
    queryKey: ["chart-weekly-demands"],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 11 * 7); // last 12 weeks
      const { data: items } = await supabase
        .from("demand_items")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .order("created_at");
      if (!items || items.length === 0) return [];

      // Group by ISO week
      const weekMap: Record<string, number> = {};
      const getWeekLabel = (d: Date) => {
        const day = d.getDate();
        const month = d.toLocaleString("pt-BR", { month: "short" });
        return `${day} ${month}`;
      };
      // Create 12 week buckets
      const buckets: { start: Date; label: string }[] = [];
      for (let i = 11; i >= 0; i--) {
        const s = new Date(now);
        s.setDate(s.getDate() - i * 7);
        s.setHours(0, 0, 0, 0);
        buckets.push({ start: s, label: getWeekLabel(s) });
      }
      buckets.forEach(b => { weekMap[b.label] = 0; });
      items.forEach(item => {
        const d = new Date(item.created_at);
        // Find the right bucket
        for (let i = buckets.length - 1; i >= 0; i--) {
          if (d >= buckets[i].start) {
            weekMap[buckets[i].label]++;
            break;
          }
        }
      });
      return buckets.map(b => ({ semana: b.label, demandas: weekMap[b.label] }));
    },
  });
  const { data: usageStats = { generations: 0, regenerations: 0, totalTokens: 0, totalWords: 0 } } = useQuery({
    queryKey: ["stats-usage"],
    queryFn: async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Check generation_logs first
      const { data: logs } = await supabase
        .from("generation_logs")
        .select("action, token_estimate, word_count")
        .gte("created_at", firstOfMonth);
      
      if (logs && logs.length > 0) {
        const generations = logs.filter(d => d.action === "generate").length;
        const regenerations = logs.filter(d => d.action === "regenerate").length;
        const totalTokens = logs.reduce((sum, d) => sum + (d.token_estimate || 0), 0);
        const totalWords = logs.reduce((sum, d) => sum + (d.word_count || 0), 0);
        return { generations, regenerations, totalTokens, totalWords };
      }
      
      // Fallback: estimate from existing completed documents
      const { data: docs } = await supabase
        .from("documents")
        .select("content, status")
        .eq("status", "completed");
      
      if (!docs || docs.length === 0) return { generations: 0, regenerations: 0, totalTokens: 0, totalWords: 0 };
      
      const totalWords = docs.reduce((sum, d) => {
        const words = d.content ? d.content.split(/\s+/).filter(Boolean).length : 0;
        return sum + words;
      }, 0);
      const totalTokens = Math.round(totalWords * 1.3);
      
      return { generations: docs.length, regenerations: 0, totalTokens, totalWords };
    },
  });

  const { data: dailyUsageData = [] } = useQuery({
    queryKey: ["chart-daily-usage"],
    queryFn: async () => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Try generation_logs first
      const { data: logs } = await supabase
        .from("generation_logs")
        .select("created_at, token_estimate, word_count")
        .gte("created_at", firstOfMonth.toISOString());
      
      // Fallback to documents if no logs
      const { data: docs } = await supabase
        .from("documents")
        .select("created_at, content, status")
        .eq("status", "completed")
        .gte("created_at", firstOfMonth.toISOString());

      // Build day map
      const dayMap: Record<number, { tokens: number; words: number; docs: number }> = {};
      for (let d = 1; d <= daysInMonth; d++) {
        dayMap[d] = { tokens: 0, words: 0, docs: 0 };
      }

      if (logs && logs.length > 0) {
        logs.forEach(l => {
          const day = new Date(l.created_at).getDate();
          dayMap[day].tokens += l.token_estimate || 0;
          dayMap[day].words += l.word_count || 0;
          dayMap[day].docs += 1;
        });
      } else if (docs && docs.length > 0) {
        docs.forEach(d => {
          const day = new Date(d.created_at).getDate();
          const words = d.content ? d.content.split(/\s+/).filter(Boolean).length : 0;
          dayMap[day].words += words;
          dayMap[day].tokens += Math.round(words * 1.3);
          dayMap[day].docs += 1;
        });
      }

      // Cumulative
      let cumTokens = 0;
      let cumWords = 0;
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        cumTokens += dayMap[day].tokens;
        cumWords += dayMap[day].words;
        return {
          dia: `${day}`,
          tokens: dayMap[day].tokens,
          palavras: dayMap[day].words,
          docs: dayMap[day].docs,
          tokensAcum: cumTokens,
          palavrasAcum: cumWords,
        };
      });
    },
  });

  const { data: recentPackages = [], isLoading } = useQuery({
    queryKey: ["recent-packages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packages")
        .select("id, status, created_at, client_id, clients(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["chart-packages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packages")
        .select("created_at")
        .order("created_at", { ascending: true });
      if (!data) return [];
      const months: Record<string, number> = {};
      data.forEach((p) => {
        const d = new Date(p.created_at);
        const key = d.toLocaleString("pt-BR", { month: "short" });
        months[key] = (months[key] || 0) + 1;
      });
      return Object.entries(months).map(([month, pacotes]) => ({ month, pacotes }));
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-light">Visão geral da plataforma</p>
        </div>
        <Link to="/briefing/novo">
          <Button className="gap-2 btn-primary-glow font-semibold">
            Novo Briefing <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clientes" value={clientCount} icon={Users} />
        <StatsCard title="Pacotes Gerados" value={packageCount} icon={Package} />
        <StatsCard title="Documentos" value={docCount} icon={FileText} />
        <StatsCard title="Templates" value={templateCount} icon={LayoutTemplate} />
      </div>

      {/* Demandas & Formulários */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Demandas" value={demandStats.total} icon={KanbanSquare} />
        <StatsCard title="Formulários" value={formCount} icon={ClipboardList} />
        <StatsCard title="Demandas Atrasadas" value={demandStats.overdue} icon={AlertTriangle} />
        <Link to="/demandas" className="contents">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-muted/40 transition-colors cursor-pointer">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Ir para Demandas</p>
              <p className="text-xs text-muted-foreground">Gerenciar tarefas</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Demandas por Status */}
      {demandStats.byStatus.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <KanbanSquare className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Demandas por Status</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={demandStats.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {demandStats.byStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsla(240,18%,8%,0.95)", border: "1px solid hsla(240,12%,22%,0.5)", borderRadius: "8px", color: "hsla(0,0%,95%,1)", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3">
              {demandStats.byStatus.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Demandas por Semana */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Demandas Criadas por Semana</h3>
        </div>
        {weeklyDemands.length > 0 && weeklyDemands.some(w => w.demandas > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyDemands}>
              <defs>
                <linearGradient id="gradDemands" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsla(240,100%,60%,0.8)" />
                  <stop offset="100%" stopColor="hsla(240,100%,60%,0.2)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,12%,20%,0.3)" />
              <XAxis dataKey="semana" stroke="hsla(240,8%,50%,1)" fontSize={10} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="hsla(240,8%,50%,1)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsla(240,18%,8%,0.95)",
                  border: "1px solid hsla(240,12%,22%,0.5)",
                  borderRadius: "8px",
                  color: "hsla(0,0%,95%,1)",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => `Semana de ${v}`}
              />
              <Bar dataKey="demandas" fill="url(#gradDemands)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma demanda criada nas últimas 12 semanas
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Consumo de IA — {new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" })}</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{usageStats.generations}</p>
              <p className="text-xs text-muted-foreground">Gerações</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-accent/10">
              <RefreshCw className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{usageStats.regenerations}</p>
              <p className="text-xs text-muted-foreground">Regenerações</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-success/10">
              <FileText className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{usageStats.totalWords.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Palavras geradas</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-warning/10">
              <Brain className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">~{usageStats.totalTokens.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Tokens estimados</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-destructive/10">
              <DollarSign className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">
                R$ {((usageStats.totalTokens / 1_000_000) * 10.00 * 5.70).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Custo estimado</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3">* Estimativa baseada no preço de output do Gemini 2.5 Pro (US$ 10,00/1M tokens) × câmbio ~R$ 5,70</p>
      </GlassCard>

      {/* AI Usage Evolution Chart */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Evolução do Consumo de IA — Diário</h3>
        </div>
        {dailyUsageData.some(d => d.tokens > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyUsageData}>
              <defs>
                <linearGradient id="gradTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsla(240,100%,60%,0.6)" />
                  <stop offset="100%" stopColor="hsla(240,100%,60%,0.02)" />
                </linearGradient>
                <linearGradient id="gradWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsla(160,100%,45%,0.5)" />
                  <stop offset="100%" stopColor="hsla(160,100%,45%,0.02)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,12%,20%,0.3)" />
              <XAxis dataKey="dia" stroke="hsla(240,8%,50%,1)" fontSize={10} interval="preserveStartEnd" tickLine={false} />
              <YAxis stroke="hsla(240,8%,50%,1)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsla(240,18%,8%,0.95)",
                  border: "1px solid hsla(240,12%,22%,0.5)",
                  borderRadius: "8px",
                  color: "hsla(0,0%,95%,1)",
                  backdropFilter: "blur(12px)",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => `Dia ${v}`}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { tokensAcum: "Tokens (acum.)", palavrasAcum: "Palavras (acum.)" };
                  return [value.toLocaleString(), labels[name] || name];
                }}
              />
              <Area
                type="monotone"
                dataKey="tokensAcum"
                stroke="hsla(240,100%,60%,0.9)"
                strokeWidth={2}
                fill="url(#gradTokens)"
                dot={false}
                activeDot={{ r: 4, fill: "hsla(240,100%,60%,1)", stroke: "hsla(240,100%,80%,0.5)", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="palavrasAcum"
                stroke="hsla(160,100%,45%,0.9)"
                strokeWidth={2}
                fill="url(#gradWords)"
                dot={false}
                activeDot={{ r: 4, fill: "hsla(160,100%,45%,1)", stroke: "hsla(160,100%,65%,0.5)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhum consumo registrado este mês
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: "hsla(240,100%,60%,0.9)" }} />
            Tokens acumulados
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: "hsla(160,100%,45%,0.9)" }} />
            Palavras acumuladas
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Pacotes por Mês</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,12%,20%,0.4)" />
                <XAxis dataKey="month" stroke="hsla(240,8%,50%,1)" fontSize={12} />
                <YAxis stroke="hsla(240,8%,50%,1)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsla(240,18%,8%,0.95)",
                    border: "1px solid hsla(240,12%,22%,0.5)",
                    borderRadius: "8px",
                    color: "hsla(0,0%,95%,1)",
                  }}
                />
                <Bar dataKey="pacotes" fill="hsla(240,100%,50%,0.8)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhum pacote gerado ainda
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-display font-semibold mb-4">Pacotes Recentes</h3>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : recentPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum pacote ainda</p>
            ) : (
              recentPackages.map((pkg: any) => (
                <Link key={pkg.id} to={`/pacote/${pkg.id}`}>
                  <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded px-2 -mx-2 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{pkg.clients?.name ?? "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(pkg.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pkg.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {pkg.status === "completed" ? "pronto" : pkg.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
