import { Button } from "@/components/ui/button";
import { FileText, Target, BarChart3, ArrowRight, CheckCircle, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import escaleLogoWhite from "@/assets/escale-logo-white.png";
import escaleIcon from "@/assets/escale-icon.png";

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
          <img src={escaleLogoWhite} alt="Escale" className="h-6" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="btn-primary-glow gap-1.5">
                Começar <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-pink/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-sm text-muted-foreground mb-10 animate-fade-in">
            <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            Plataforma de Inteligência Comercial
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 animate-fade-in-up leading-[0.95]" style={{ animationDelay: "0.1s" }}>
            Briefing entra,{" "}
            <span className="gradient-text">pacote completo</span>{" "}
            sai.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up font-light" style={{ animationDelay: "0.2s" }}>
            Transforme briefings de clientes em pacotes comerciais completos com IA.
            8 documentos estratégicos gerados automaticamente.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/login">
              <Button size="lg" className="btn-primary-glow gap-2 text-base h-12 px-8 font-semibold">
                Começar Agora <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-base h-12 px-8 border-border/60 hover:bg-secondary">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto font-light">
            Em 3 passos simples, do briefing ao pacote completo.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "1. Preencha o Briefing", desc: "Formulário inteligente com 6 dimensões estratégicas do negócio do cliente." },
              { icon: Target, title: "2. IA Processa", desc: "Nossa IA analisa os dados e gera 8 documentos estratégicos personalizados." },
              { icon: BarChart3, title: "3. Receba o Pacote", desc: "Documentos prontos para uso: plano comercial, proposta, scripts e mais." },
            ].map((f, i) => (
              <GlassCard key={i} glow className="hover-scale animate-fade-in-up group" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                <div className="rounded-xl bg-primary/10 p-3.5 w-fit mb-5 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="gradient-text">8 documentos</span> por pacote
          </h2>
          <p className="text-center text-muted-foreground mb-14 font-light">
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
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <GlassCard glow className="py-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <img src={escaleIcon} alt="" className="h-12 mx-auto mb-6 opacity-80" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Pronto para escalar?</h2>
            <p className="text-muted-foreground mb-8 font-light">
              Crie sua conta e comece a gerar pacotes comerciais em minutos.
            </p>
            <Link to="/login">
              <Button size="lg" className="btn-primary-glow gap-2 h-12 px-8 font-semibold">
                Criar Conta Grátis <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="container mx-auto flex flex-col items-center gap-4">
          <img src={escaleLogoWhite} alt="Escale" className="h-5 opacity-50" />
          <p className="text-xs text-muted-foreground">© 2026 Escale. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
