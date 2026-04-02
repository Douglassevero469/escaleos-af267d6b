import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, CheckCircle, XCircle, ArrowRight,
  FileText, Target, BarChart3, Layout, Users, ListChecks,
  PhoneCall, ChevronDown, Sparkles, Shield, Clock, Zap,
  MessageCircle, Star, Quote, TrendingUp, Rocket,
  Globe, Layers, PieChart, MousePointerClick
} from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import escaleLogoWhite from "@/assets/escale-logo-white.png";
import escaleLogoDark from "@/assets/escale-logo-dark.png";
import escaleIcon from "@/assets/escale-icon.png";
import { useEffect, useState, useRef } from "react";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Quero%20saber%20mais%20sobre%20o%20Super%20Pacote%20Escale";
const CTA_LINK = WHATSAPP_LINK;

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─── Scroll-triggered fade-in ─── */
function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Grid background pattern ─── */
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--border) / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.15) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}

/* ─── Floating orbs ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[180px] animate-float" />
      <div className="absolute top-40 right-[15%] w-[300px] h-[300px] bg-cyan/8 rounded-full blur-[150px] animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-20 left-[30%] w-[350px] h-[350px] bg-lilac/6 rounded-full blur-[160px] animate-float" style={{ animationDelay: "4s" }} />
    </div>
  );
}

/* ─── Sticky top bar ─── */
function StickyTopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60]">
      <div className="bg-primary/95 backdrop-blur-md text-primary-foreground py-2.5 px-4 text-center text-sm font-medium tracking-wide">
        <span className="hidden sm:inline">🚀 </span>
        Estratégia + Comercial + Mídia + Landing Page + CRM em uma única solução
      </div>
    </div>
  );
}

/* ─── Sticky bottom CTA (mobile) ─── */
function StickyBottomCTA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[60] transition-transform duration-300 md:hidden ${visible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="glass-strong p-3">
        <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full btn-primary-glow gap-2 h-12 font-semibold">
            <MessageCircle className="h-4 w-4" /> Quero falar com a Escale
          </Button>
        </a>
      </div>
    </div>
  );
}

/* ─── Section title ─── */
function SectionTitle({ children, className = "", subtitle }: { children: React.ReactNode; className?: string; subtitle?: string }) {
  return (
    <div className={className}>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">{children}</h2>
      {subtitle && <p className="text-muted-foreground text-base md:text-lg max-w-2xl">{subtitle}</p>}
    </div>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-6">
      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      {children}
    </div>
  );
}

/* ─── Pain point ─── */
function PainPoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 rounded-full bg-destructive/10 p-1">
        <XCircle className="h-4 w-4 text-destructive" />
      </div>
      <span className="text-muted-foreground text-sm md:text-base">{children}</span>
    </div>
  );
}

/* ─── Check item ─── */
function CheckItem({ children, bold = false }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 rounded-full bg-primary/10 p-1">
        <CheckCircle className="h-4 w-4 text-primary" />
      </div>
      <span className={`text-sm md:text-base ${bold ? "font-semibold" : ""}`}>{children}</span>
    </div>
  );
}

/* ─── Package block ─── */
function PackageBlock({ icon: Icon, title, desc, items, accent = false }: {
  icon: React.ElementType; title: string; desc: string; items: string[]; accent?: boolean;
}) {
  return (
    <div className={`group relative rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 ${
      accent
        ? "bg-primary/5 border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)]"
        : "glass hover:border-primary/20"
    }`}>
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3.5 w-fit mb-5">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{desc}</p>
      <div className="space-y-0.5">
        {items.map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
      </div>
    </div>
  );
}

/* ─── Testimonial card ─── */
function TestimonialCard({ name, role, company, text, rating = 5 }: {
  name: string; role: string; company: string; text: string; rating?: number;
}) {
  return (
    <div className="relative rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
      <Quote className="h-8 w-8 text-primary/20 mb-4" />
      <p className="text-sm md:text-base text-foreground/90 mb-6 leading-relaxed italic">
        "{text}"
      </p>
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-warning text-warning" />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-primary-foreground font-bold text-sm">
          {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{role} · {company}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat counter ─── */
function StatCounter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">
        {count}{suffix}
      </p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

/* ─── Data ─── */
const miniSeals = [
  { icon: Shield, label: "Estrutura completa" },
  { icon: Zap, label: "Alta conversão" },
  { icon: Users, label: "1 ano de CRM" },
  { icon: Layout, label: "1 ano de LP" },
  { icon: ListChecks, label: "Implementação orientada" },
];

const testimonials = [
  {
    name: "Ricardo Mendes",
    role: "CEO",
    company: "TechSol",
    text: "A Escale transformou completamente nossa operação comercial. Saímos de um cenário caótico para um processo estruturado que triplicou nossa taxa de conversão em 6 meses.",
  },
  {
    name: "Ana Carolina Silva",
    role: "Diretora de Marketing",
    company: "Grupo Innova",
    text: "O pacote da Escale nos deu o que nenhuma agência conseguiu: clareza estratégica real. Agora cada ação de marketing tem propósito e cada lead é acompanhado com processo.",
  },
  {
    name: "Fernando Costa",
    role: "Fundador",
    company: "Costa & Associados",
    text: "Investimos em várias soluções separadas antes da Escale. O diferencial deles é entregar tudo integrado — estratégia, mídia, LP e CRM funcionando como um sistema único.",
  },
  {
    name: "Mariana Duarte",
    role: "Gestora Comercial",
    company: "Duarte Consultoria",
    text: "O CRM e a landing page que recebemos são incríveis. Mas o que realmente mudou o jogo foi o planejamento estratégico — finalmente temos direção clara de crescimento.",
  },
];

const faqItems = [
  { q: "O que exatamente eu recebo ao contratar?", a: "Você recebe um pacote completo com planejamento estratégico, plano comercial, plano de mídia, landing page de alta conversão, CRM e passo a passo de implementação." },
  { q: "Por quanto tempo terei acesso à landing page e ao CRM?", a: "Você terá 1 ano de acesso à landing page e 1 ano de acesso ao CRM, conforme a oferta apresentada." },
  { q: "Isso serve para qualquer tipo de empresa?", a: "A solução é ideal para empresas que querem estruturar marketing e comercial com mais clareza, processo e intenção de crescimento." },
  { q: "A landing page já vem pronta?", a: "Sim, a proposta inclui a landing page dentro do pacote, pensada com foco em alta conversão." },
  { q: "O CRM está incluso no valor?", a: "Sim. O acesso ao CRM por 1 ano já está incluso no pacote." },
  { q: "Esse pacote é só estratégico ou também orienta a execução?", a: "Além da estrutura estratégica, você recebe o passo a passo de implementação para saber como aplicar a solução." },
  { q: "Qual é o valor?", a: "O investimento é de R$ 8.497, podendo ser parcelado em 12x sem juros de R$ 708,08." },
];

const objections = [
  { q: "Hoje eu ainda faço muita coisa no improviso.", a: "Justamente por isso essa solução faz sentido. Ela foi desenhada para ajudar sua empresa a sair da operação desorganizada e ganhar estrutura." },
  { q: "Será que eu preciso de tudo isso?", a: "Se o seu objetivo é crescer com mais previsibilidade, não faz sentido olhar só uma parte. Marketing, comercial, conversão e gestão precisam conversar entre si." },
  { q: "Eu já investi antes e não tive resultado.", a: "Muitas vezes o problema não foi investir. Foi investir em ações desconectadas. Aqui, a proposta é integrar estratégia, captação, conversão e organização comercial." },
  { q: "Parece muito para implementar.", a: "Por isso a entrega inclui o passo a passo. A ideia não é te deixar perdido, mas te dar direção clara sobre como colocar a estrutura para funcionar." },
  { q: "Posso contratar isso depois.", a: "Pode. Mas adiar organização custa caro. Cada mês sem estrutura representa oportunidades perdidas, retrabalho e crescimento abaixo do potencial." },
];

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function Index() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <StickyTopBar />
      <StickyBottomCTA />

      {/* ===== 1. HERO ===== */}
      <section className="relative pt-20 pb-28 px-4 overflow-hidden min-h-[90vh] flex items-center">
        <GridPattern />
        <FloatingOrbs />
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <FadeInSection>
            <div className="mb-10">
              <img src={escaleLogoDark} alt="Escale" className="h-10 mx-auto" />
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <SectionLabel>+15 anos de experiência em comunicação</SectionLabel>
          </FadeInSection>

          <FadeInSection delay={200}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[0.95]">
              Sua empresa não precisa de mais uma agência.{" "}
              <span className="gradient-text">Precisa de estrutura para crescer.</span>
            </h1>
          </FadeInSection>

          <FadeInSection delay={300}>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-10 font-light leading-relaxed">
              A Escale entrega um pacote completo com planejamento estratégico, plano comercial, plano de mídia, landing page de alta conversão e CRM — tudo com passo a passo de implementação para sua empresa sair do improviso e entrar em um modelo de crescimento real.
            </p>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="relative inline-block mb-10">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-cyan/20 to-primary/20 rounded-2xl blur-lg" />
              <div className="relative glass rounded-2xl py-5 px-10 border border-primary/20">
                <p className="text-muted-foreground text-sm mb-1 uppercase tracking-wider">Investimento</p>
                <p className="text-3xl md:text-4xl font-bold gradient-text">12x de R$ 708,08</p>
                <p className="text-muted-foreground text-sm mt-1">sem juros ou R$ 8.497 à vista</p>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={500}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="btn-primary-glow gap-2 text-base h-14 px-10 font-semibold rounded-xl">
                  Quero estruturar meu negócio <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="text-base h-14 px-8 border-border/60 hover:bg-secondary gap-2 rounded-xl">
                  <PhoneCall className="h-4 w-4" /> Falar com especialista
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">Sem achismo. Sem gambiarra. Sem depender de tentativa e erro para crescer.</p>
          </FadeInSection>

          {/* Mini seals */}
          <FadeInSection delay={600}>
            <div className="flex flex-wrap justify-center gap-3 mt-14">
              {miniSeals.map((s, i) => (
                <div key={i} className="rounded-full border border-border/50 bg-card/50 backdrop-blur-sm px-5 py-2.5 flex items-center gap-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground">
                  <s.icon className="h-4 w-4 text-primary" />
                  {s.label}
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 px-4 border-y border-border/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter target={15} suffix="+" label="Anos de experiência" />
            <StatCounter target={200} suffix="+" label="Projetos entregues" />
            <StatCounter target={50} suffix="+" label="Empresas atendidas" />
            <StatCounter target={98} suffix="%" label="Satisfação dos clientes" />
          </div>
        </div>
      </section>

      {/* ===== 2. PROBLEMA ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-3xl relative z-10">
          <FadeInSection>
            <SectionLabel>O Problema</SectionLabel>
            <SectionTitle subtitle="Muitas empresas até têm um bom produto ou serviço, mas travam porque não existe um sistema comercial e de marketing realmente organizado por trás.">
              Se hoje sua empresa vende no improviso, o problema não é falta de esforço.{" "}
              <span className="gradient-text">É falta de estrutura.</span>
            </SectionTitle>
          </FadeInSection>

          <FadeInSection delay={200}>
            <p className="text-muted-foreground mb-6 mt-8">No dia a dia, isso aparece de várias formas:</p>
            <div className="rounded-2xl glass p-8">
              <div className="grid md:grid-cols-2 gap-x-6">
                {[
                  "ações soltas sem estratégia",
                  "time perdido sem direção clara",
                  "tráfego sem funil estruturado",
                  "landing page que não converte",
                  "leads entrando sem processo de acompanhamento",
                  "falta de CRM para organizar oportunidades",
                  "comunicação inconsistente",
                  "crescimento travado por falta de método",
                ].map((item, i) => <PainPoint key={i}>{item}</PainPoint>)}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="mt-8 rounded-xl border border-border/30 bg-card/30 p-6 text-center">
              <p className="text-muted-foreground italic">
                O resultado é sempre parecido: você trabalha muito, investe em marketing, mas sente que a operação comercial <strong className="text-foreground">não anda no ritmo que deveria.</strong>
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 3. AGITAÇÃO ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <FadeInSection>
            <SectionLabel>O Custo</SectionLabel>
            <SectionTitle>
              Crescer sem estratégia <span className="gradient-text">custa caro.</span>
            </SectionTitle>
            <p className="text-muted-foreground mt-6 mb-8">
              Quando a empresa não tem clareza de posicionamento, processo comercial, estrutura de mídia e operação organizada, o prejuízo não vem só em dinheiro investido errado.
            </p>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, text: "oportunidades perdidas" },
                { icon: Users, text: "equipe desalinhada" },
                { icon: MousePointerClick, text: "leads desperdiçados" },
                { icon: PieChart, text: "campanhas sem retorno" },
                { icon: BarChart3, text: "baixa previsibilidade comercial" },
                { icon: Layers, text: "retrabalho constante" },
                { icon: Clock, text: "sensação de que tudo depende de você" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl glass p-4 transition-all hover:border-destructive/20">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <item.icon className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="mt-12 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-cyan/10 rounded-2xl blur-lg" />
              <div className="relative rounded-2xl glass p-8 text-center border border-primary/20">
                <p className="text-xl md:text-2xl font-bold leading-relaxed">
                  Sem estrutura, cada ação parece urgente.<br />
                  <span className="gradient-text">Com estrutura, cada ação passa a ter função, meta e direção.</span>
                </p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 4. SOLUÇÃO ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <FadeInSection>
            <SectionLabel>A Solução</SectionLabel>
            <SectionTitle className="text-center mx-auto">
              Foi para resolver isso que criamos o{" "}
              <span className="gradient-text">Super Pacote da Escale.</span>
            </SectionTitle>
          </FadeInSection>

          <FadeInSection delay={200}>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto mt-6">
              A Escale reúne em uma única entrega tudo o que uma empresa precisa para sair da desorganização e construir uma operação comercial e de marketing mais inteligente, previsível e escalável.
            </p>
            <p className="text-muted-foreground mb-12">
              Você não compra peças separadas. Você recebe uma <strong className="text-foreground">estrutura integrada</strong>, com lógica, estratégia e execução orientada.
            </p>
          </FadeInSection>

          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
            {[
              { icon: Target, text: "Planejamento estratégico" },
              { icon: BarChart3, text: "Plano comercial" },
              { icon: PieChart, text: "Plano de mídia" },
              { icon: Layout, text: "Landing page de alta conversão" },
              { icon: Users, text: "CRM com acesso por 1 ano" },
              { icon: Globe, text: "Acesso por 1 ano à landing page" },
              { icon: ListChecks, text: "Passo a passo para implementação" },
            ].map((item, i) => (
              <FadeInSection key={i} delay={300 + i * 80}>
                <div className="flex items-center gap-4 rounded-xl glass p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-2.5">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{item.text}</span>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={800}>
            <p className="text-muted-foreground mt-12 italic">
              Não é só uma entrega bonita. É uma <strong className="text-foreground">arquitetura de crescimento</strong> para sua empresa.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 5. O QUE ESTÁ INCLUSO ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <FadeInSection>
            <div className="text-center mb-16">
              <SectionLabel>Detalhamento</SectionLabel>
              <SectionTitle className="text-center mx-auto max-w-3xl">
                O que está incluso no <span className="gradient-text">pacote da Escale</span>
              </SectionTitle>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Planejamento Estratégico", desc: "Definimos a direção do seu negócio com mais clareza, posicionamento, metas, prioridades e estrutura de crescimento.", items: ["Diagnóstico macro da operação", "Clareza de posicionamento", "Definição de prioridades", "Estrutura de metas e direcionamento", "Visão estratégica para tomada de decisão"], accent: true },
              { icon: BarChart3, title: "Plano Comercial", desc: "Organizamos sua frente de vendas para transformar interesse em processo, e processo em fechamento.", items: ["Definição de fluxo comercial", "Organização das etapas do funil", "Critérios de abordagem", "Orientação de processo de atendimento", "Estrutura para acompanhar oportunidades"] },
              { icon: Sparkles, title: "Plano de Mídia", desc: "Criamos um direcionamento para investir em mídia com mais inteligência, coerência e intenção estratégica.", items: ["Definição de campanhas", "Estrutura de objetivos por etapa", "Direcionamento de públicos", "Distribuição de verba", "Comunicação por fase do funil"] },
              { icon: Layout, title: "Landing Page de Alta Conversão", desc: "Desenvolvemos uma página pensada para transformar tráfego em lead e lead em oportunidade real.", items: ["Estrutura persuasiva", "Copy focada em conversão", "Página com foco em captação", "Clareza e performance", "1 ano de acesso à landing page"], accent: true },
              { icon: Users, title: "CRM com 1 ano de acesso", desc: "Organize leads, negociações, acompanhamento comercial e relacionamento com mais controle.", items: ["Estrutura de CRM para gestão comercial", "Acompanhamento das oportunidades", "Organização do pipeline", "Visão clara sobre andamento dos leads", "1 ano de acesso incluso"] },
              { icon: ListChecks, title: "Passo a passo de implementação", desc: "Além de entregar a estrutura, mostramos o caminho para colocar tudo em prática.", items: ["Orientação prática", "Visão de implementação", "Direcionamento para execução", "Clareza sobre o que fazer e em que ordem"], accent: true },
            ].map((block, i) => (
              <FadeInSection key={i} delay={i * 100}>
                <PackageBlock {...block} />
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. DIFERENCIAÇÃO ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-3xl relative z-10">
          <FadeInSection>
            <SectionLabel>Diferencial</SectionLabel>
            <SectionTitle subtitle="O que torna essa oferta diferente é que ela não foi pensada para resolver um problema isolado. Ela foi pensada para resolver o cenário completo.">
              A maioria vende serviço.{" "}
              <span className="gradient-text">A Escale entrega estrutura.</span>
            </SectionTitle>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="grid sm:grid-cols-2 gap-3 mt-10">
              {[
                "se posicionar melhor",
                "vender com mais processo",
                "atrair com mais inteligência",
                "converter com mais eficiência",
                "organizar a operação comercial",
                "crescer com mais previsibilidade",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl glass p-4 transition-all hover:border-primary/30">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="mt-12 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-cyan/10 rounded-2xl blur-lg" />
              <div className="relative rounded-2xl glass p-8 text-center border border-primary/20">
                <p className="text-lg md:text-xl font-bold leading-relaxed">
                  Em vez de contratar várias soluções separadas, você recebe um{" "}
                  <span className="gradient-text">pacote integrado</span>, com começo, meio e direção.
                </p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== DEPOIMENTOS ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <FadeInSection>
            <div className="text-center mb-16">
              <SectionLabel>Depoimentos</SectionLabel>
              <SectionTitle className="text-center mx-auto max-w-3xl">
                O que nossos clientes <span className="gradient-text">dizem sobre a Escale</span>
              </SectionTitle>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <FadeInSection key={i} delay={i * 150}>
                <TestimonialCard {...t} />
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 7. PARA QUEM É ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-3xl relative z-10">
          <FadeInSection>
            <SectionLabel>Para quem é</SectionLabel>
            <SectionTitle subtitle="A solução da Escale faz sentido para negócios que já entenderam: não basta aparecer, é preciso estruturar a operação para transformar atenção em venda.">
              Esse pacote é para empresas que querem{" "}
              <span className="gradient-text">parar de improvisar.</span>
            </SectionTitle>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="rounded-2xl glass p-8 mt-8">
              <div className="space-y-0.5">
                {[
                  "querem organizar marketing e comercial de forma mais profissional",
                  "já vendem, mas sentem que o crescimento está desorganizado",
                  "precisam melhorar conversão",
                  "querem sair do operacional solto e entrar em um processo mais claro",
                  "precisam de uma landing page que realmente ajude a gerar resultado",
                  "querem controlar melhor leads e oportunidades com CRM",
                  "valorizam estratégia antes da execução",
                ].map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 8. PARA QUEM NÃO É ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <FadeInSection>
            <SectionLabel>Transparência</SectionLabel>
            <SectionTitle>Para quem <span className="text-destructive">não</span> é</SectionTitle>
          </FadeInSection>
          <FadeInSection delay={200}>
            <div className="rounded-2xl glass p-8 mt-8 border-destructive/10 border">
              <div className="space-y-0.5">
                {[
                  "procura apenas um serviço pontual e barato",
                  "quer resultado sem implementar nada",
                  "não vê valor em estratégia",
                  "prefere continuar no improviso",
                  "busca só \"mais posts\" ou \"mais tráfego\" sem estrutura por trás",
                ].map((item, i) => <PainPoint key={i}>{item}</PainPoint>)}
              </div>
            </div>
            <p className="text-muted-foreground mt-6">Nosso foco é em empresas que querem <strong className="text-foreground">construir base para crescer.</strong></p>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 9. ANTES & DEPOIS ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-4xl relative z-10">
          <FadeInSection>
            <div className="text-center mb-12">
              <SectionLabel>Transformação</SectionLabel>
              <SectionTitle className="text-center mx-auto max-w-3xl">
                O que muda quando sua empresa{" "}
                <span className="gradient-text">sai do improviso</span>
              </SectionTitle>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeInSection delay={100}>
              <div className="rounded-2xl glass p-8 border border-destructive/15 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive">Antes</h3>
                </div>
                <div className="space-y-0.5">
                  {[
                    "marketing sem direção",
                    "comercial desorganizado",
                    "leads sem acompanhamento",
                    "página sem estratégia",
                    "mídia sem lógica clara",
                    "tudo concentrado na sua cabeça",
                  ].map((item, i) => <PainPoint key={i}>{item}</PainPoint>)}
                </div>
              </div>
            </FadeInSection>
            <FadeInSection delay={250}>
              <div className="rounded-2xl glass p-8 border border-primary/20 h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan to-primary" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Depois</h3>
                </div>
                <div className="space-y-0.5">
                  {[
                    "posicionamento mais claro",
                    "funil comercial mais organizado",
                    "plano de mídia com intenção",
                    "landing page focada em conversão",
                    "CRM para acompanhar oportunidades",
                    "operação mais estruturada para crescer",
                  ].map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
                </div>
              </div>
            </FadeInSection>
          </div>

          <FadeInSection delay={400}>
            <p className="text-center text-muted-foreground mt-10 italic text-lg">
              Você para de apagar incêndio e começa a operar com mais inteligência.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 10. VALOR PERCEBIDO ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <FadeInSection>
            <SectionLabel>Investimento</SectionLabel>
            <SectionTitle>
              Se você fosse contratar tudo isso separadamente,{" "}
              <span className="gradient-text">pagaria muito mais.</span>
            </SectionTitle>
            <p className="text-muted-foreground mt-6 mb-8">Pense no custo de contratar individualmente:</p>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "consultoria estratégica",
                "estruturação comercial",
                "planejamento de mídia",
                "copy e construção de landing page",
                "CRM",
                "implementação orientada",
                "acompanhamento da lógica de operação",
              ].map((item, i) => <CheckItem key={i} bold>{item}</CheckItem>)}
            </div>
            <p className="text-muted-foreground mt-10">
              Na Escale, tudo isso está organizado em um <strong className="text-foreground">único pacote</strong>, com uma entrega lógica e integrada.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 11. OFERTA ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-2xl text-center relative z-10">
          <FadeInSection>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-primary/15 via-cyan/10 to-primary/15 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl glass p-10 md:p-14 border border-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan to-primary" />
                <img src={escaleIcon} alt="" className="h-14 mx-auto mb-8 opacity-80" />
                <SectionTitle className="text-center">
                  Tudo isso por apenas{" "}
                  <span className="gradient-text">12x de R$ 708,08</span>
                </SectionTitle>
                <p className="text-muted-foreground mb-10 mt-2">sem juros ou R$ 8.497 à vista</p>

                <div className="grid sm:grid-cols-2 gap-3 text-left max-w-md mx-auto mb-10">
                  {[
                    "Planejamento estratégico",
                    "Plano comercial",
                    "Plano de mídia",
                    "Landing page de alta conversão",
                    "1 ano de acesso à LP",
                    "CRM com 1 ano de acesso",
                    "Passo a passo de implementação",
                  ].map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
                </div>

                <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="btn-primary-glow gap-2 h-14 px-12 font-semibold text-base rounded-xl">
                    Quero contratar o Super Pacote <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
                <p className="text-sm text-muted-foreground mt-5">
                  Uma solução pensada para quem quer organizar o presente e preparar o crescimento do negócio.
                </p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 12. OBJEÇÕES ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <FadeInSection>
            <SectionLabel>Dúvidas comuns</SectionLabel>
            <SectionTitle>Talvez você esteja pensando…</SectionTitle>
          </FadeInSection>
          <div className="space-y-4 mt-10">
            {objections.map((obj, i) => (
              <FadeInSection key={i} delay={i * 100}>
                <div className="rounded-2xl glass p-6 transition-all hover:border-primary/20">
                  <p className="font-bold mb-3 flex items-start gap-2">
                    <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    "{obj.q}"
                  </p>
                  <p className="text-muted-foreground text-sm pl-7">{obj.a}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 13. AUTORIDADE ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <FadeInSection>
            <SectionLabel>Sobre a Escale</SectionLabel>
            <SectionTitle className="text-center">
              A Escale existe para{" "}
              <span className="gradient-text">estruturar crescimento.</span>
            </SectionTitle>
            <div className="mt-8 space-y-4 text-muted-foreground">
              <p>
                Com mais de 15 anos de experiência em comunicação, nosso trabalho não é empilhar entregas. É construir clareza, processo e direção para empresas que querem crescer de forma mais estratégica.
              </p>
              <p>
                Acreditamos que negócios evoluem quando marketing, comercial, conversão e gestão deixam de atuar de forma solta e passam a funcionar como sistema.
              </p>
            </div>
            <p className="text-xl font-bold mt-8 gradient-text inline-block">É isso que entregamos nesse pacote.</p>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 14. FAQ ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <FadeInSection>
            <div className="text-center mb-12">
              <SectionLabel>FAQ</SectionLabel>
              <SectionTitle className="text-center">Perguntas frequentes</SectionTitle>
            </div>
          </FadeInSection>
          <FadeInSection delay={200}>
            <Accordion type="single" collapsible>
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/30 rounded-xl mb-2 glass px-4">
                  <AccordionTrigger className="text-left font-semibold text-base hover:no-underline py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 15. URGÊNCIA ===== */}
      <section className="py-24 px-4 relative">
        <GridPattern />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <FadeInSection>
            <SectionLabel>Momento de decidir</SectionLabel>
            <SectionTitle className="text-center mx-auto">
              Se improvisar já começou a custar caro,{" "}
              <span className="gradient-text">essa é a hora de estruturar.</span>
            </SectionTitle>
            <p className="text-muted-foreground mt-6 mb-10">
              Quanto mais um negócio cresce sem organização, mais caro fica corrigir depois. A decisão aqui não é apenas contratar uma solução. É escolher operar com mais inteligência.
            </p>
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="btn-primary-glow gap-2 h-14 px-10 font-semibold rounded-xl">
                Quero organizar meu marketing e comercial <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
          </FadeInSection>
        </div>
      </section>

      {/* ===== 16. FECHAMENTO ===== */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <FadeInSection>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-cyan/8 to-lilac/10 rounded-3xl blur-3xl" />
              <div className="relative rounded-3xl glass p-12 md:p-16 border border-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan to-lilac" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-lilac via-cyan to-primary" />
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                  Sua empresa pode continuar no improviso.{" "}
                  <span className="gradient-text">Ou pode entrar em uma nova fase.</span>
                </h2>
                <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Com a Escale, você recebe uma estrutura completa para posicionar melhor sua empresa, organizar o comercial, melhorar sua conversão e construir uma operação mais preparada para crescer.
                </p>

                <div className="inline-block rounded-xl glass p-6 mb-10 border border-border/40">
                  <p className="font-bold text-lg">Super Pacote Escale</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Planejamento + Comercial + Mídia + LP + CRM + Passo a Passo
                  </p>
                  <p className="text-3xl font-bold gradient-text mt-2">R$ 8.497 em até 12x sem juros</p>
                </div>

                <div className="block">
                  <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="btn-primary-glow gap-2 h-14 px-12 font-semibold text-base rounded-xl">
                      Quero contratar agora <ArrowUpRight className="h-5 w-5" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-4">
        <div className="container mx-auto flex flex-col items-center gap-4">
          <img src={escaleLogoWhite} alt="Escale" className="h-6 opacity-40" />
          <p className="text-xs text-muted-foreground">© 2026 Escale. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
