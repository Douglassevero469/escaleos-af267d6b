import { StatsCard } from "@/components/ui/StatsCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, FileText, Package, LayoutTemplate, ArrowUpRight, Loader2, Zap, RefreshCw, Brain } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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

  // Usage stats from generation_logs
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

      {/* Usage Stats - Current Month */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Consumo de IA — {new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" })}</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
