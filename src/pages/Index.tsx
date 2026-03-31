import { Button } from "@/components/ui/button";
import { Zap, FileText, Target, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";

const documents = [
  "Plano Comercial Estratégico",
  "Proposta Comercial",
  "Roteiro de Vendas",
  "Script de Prospecção",
  "Plano de Marketing",
  "Análise de Concorrência",
  "Análise SWOT",
  "Resumo Executivo",
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">EscaleOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-muted-foreground mb-8 animate-fade-in">
            <Zap className="h-3 w-3 text-primary" />
            Plataforma de Inteligência Comercial
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Briefing entra,{" "}
            <span className="gradient-text">pacote completo</span>{" "}
            sai.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Transforme briefings de clientes em pacotes comerciais completos com IA.
            8 documentos estratégicos gerados automaticamente.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/login">
              <Button size="lg" className="gap-2 text-base">
                Começar Agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-base">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Em 3 passos simples, do briefing ao pacote completo.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "1. Preencha o Briefing", desc: "Formulário inteligente com 6 dimensões estratégicas do negócio do cliente." },
              { icon: Target, title: "2. IA Processa", desc: "Nossa IA analisa os dados e gera 8 documentos estratégicos personalizados." },
              { icon: BarChart3, title: "3. Receba o Pacote", desc: "Documentos prontos para uso: plano comercial, proposta, scripts e mais." },
            ].map((f, i) => (
              <GlassCard key={i} glow className="hover-scale animate-fade-in-up" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="gradient-text">8 documentos</span> por pacote
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Cada briefing gera um pacote completo com todos esses documentos.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {documents.map((doc, i) => (
              <GlassCard key={i} className="flex items-center gap-3 py-4 animate-fade-in" style={{ animationDelay: `${0.05 * i}s` }}>
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{doc}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <GlassCard glow className="py-12">
            <h2 className="text-3xl font-bold mb-4">Pronto para escalar?</h2>
            <p className="text-muted-foreground mb-8">
              Crie sua conta e comece a gerar pacotes comerciais em minutos.
            </p>
            <Link to="/login">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2026 EscaleOS. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
