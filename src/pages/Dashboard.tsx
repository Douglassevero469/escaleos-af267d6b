import { StatsCard } from "@/components/ui/StatsCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, FileText, Package, LayoutTemplate, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const chartData = [
  { month: "Jan", pacotes: 4 },
  { month: "Fev", pacotes: 7 },
  { month: "Mar", pacotes: 5 },
  { month: "Abr", pacotes: 12 },
  { month: "Mai", pacotes: 9 },
  { month: "Jun", pacotes: 15 },
];

const recentPackages = [
  { client: "Studio Fitness Prime", date: "28 Mar 2026", status: "pronto", docs: 8 },
  { client: "Clínica Estética Bella", date: "25 Mar 2026", status: "pronto", docs: 8 },
  { client: "Tech Solutions LTDA", date: "22 Mar 2026", status: "gerando", docs: 5 },
  { client: "Restaurante Sabor & Arte", date: "20 Mar 2026", status: "pronto", docs: 8 },
];

export default function Dashboard() {
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
        <StatsCard title="Total Clientes" value={42} icon={Users} change="+12% este mês" positive />
        <StatsCard title="Pacotes Gerados" value={156} icon={Package} change="+8% este mês" positive />
        <StatsCard title="Documentos" value="1.248" icon={FileText} change="+15% este mês" positive />
        <StatsCard title="Templates" value={18} icon={LayoutTemplate} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Pacotes por Mês</h3>
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
        </GlassCard>

        <GlassCard>
          <h3 className="font-display font-semibold mb-4">Pacotes Recentes</h3>
          <div className="space-y-3">
            {recentPackages.map((pkg, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">{pkg.client}</p>
                  <p className="text-xs text-muted-foreground">{pkg.date}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pkg.status === "pronto" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {pkg.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
