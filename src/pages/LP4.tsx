import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import {
  ArrowRight,
  Check,
  X,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Brain,
  Users,
  Settings,
  LineChart,
  Sparkles,
  Rocket,
  Database,
  Bot,
  CircleDot,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ---------- Design tokens (escopados à LP4) ---------- */
const tokens = {
  bg: "#0A0F1C",
  bgAlt: "#0F172A",
  blue: "#3B82F6",
  green: "#22C55E",
  purple: "#6366F1",
  text: "#E5E7EB",
  textMuted: "#9CA3AF",
};

/* ---------- Count up ---------- */
function CountUp({ end, prefix = "", suffix = "", duration = 1.6 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: end,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = `${prefix}${Math.floor(obj.val).toLocaleString("pt-BR")}${suffix}`;
          },
        });
      },
    });
    return () => trigger.kill();
  }, [end, prefix, suffix, duration]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ---------- Page ---------- */
export default function LP4() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [pipelineProgress, setPipelineProgress] = useState([0, 0, 0, 0]);

  // SEO
  useEffect(() => {
    document.title = "Escale — Sistema operacional de crescimento previsível";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Organize seu comercial com processos, indicadores e tecnologia. Crescimento previsível em 30 dias."
    );
    if (!meta.parentNode) document.head.appendChild(meta);

    const canonical =
      document.querySelector('link[rel="canonical"]') ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    canonical.setAttribute("href", `${window.location.origin}/lp4`);
    if (!canonical.parentNode) document.head.appendChild(canonical);
  }, []);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  // Cursor glow
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const move = (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.4, ease: "power2.out" });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Reveals
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((parent) => {
        const items = parent.querySelectorAll("[data-stagger-item]");
        gsap.from(items, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: parent, start: "top 85%" },
        });
      });

      // Hero highlight progressivo
      gsap.from(".hero-headline span", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        delay: 0.2,
      });
      gsap.from(".hero-mock", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.4,
      });

      // Pipeline animação
      ScrollTrigger.create({
        trigger: ".crm-section",
        start: "top 70%",
        once: true,
        onEnter: () => setPipelineProgress([78, 62, 45, 30]),
      });

      // Parallax background hero
      gsap.to(".hero-bg-orb", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${tokens.bg}, ${tokens.bgAlt}, #1E3A8A)`,
        color: tokens.text,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Cursor glow */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-50 hidden lg:block"
        style={{
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Floating orbs background */}
      <div className="hero-bg-orb pointer-events-none absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)", filter: "blur(40px)" }} />
      <div className="hero-bg-orb pointer-events-none absolute top-[40%] left-[-300px] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)", filter: "blur(60px)" }} />

      {/* Top nav minimal */}
      <header className="relative z-20 max-w-[1200px] mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight lowercase">escale<span style={{ color: tokens.blue }}>.</span></div>
        <a
          href="#cta-final"
          className="text-xs lowercase tracking-wide px-4 py-2 rounded-lg border transition-all hover:scale-[1.02]"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
        >
          falar com especialista
        </a>
      </header>

      {/* ============== HERO ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 pt-16 pb-32 lg:pt-24 lg:pb-40 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-[11px] tracking-wide lowercase"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD" }}>
            <CircleDot className="w-3 h-3" /> sistema operacional de crescimento previsível
          </div>

          <h1 className="hero-headline text-[44px] lg:text-[64px] leading-[1.05] font-semibold tracking-[-0.03em] lowercase mb-8">
            <span className="block">seu comercial cresce</span>
            <span className="block">por estratégia</span>
            <span className="block" style={{ color: tokens.blue }}>ou por achismo?</span>
          </h1>

          <p className="text-lg leading-relaxed mb-4 max-w-xl" style={{ color: tokens.textMuted }}>
            Organizamos o setor comercial da sua empresa com processos, indicadores, inteligência operacional e tecnologia aplicada para gerar crescimento previsível.
          </p>
          <p className="text-base mb-10 max-w-xl" style={{ color: tokens.text }}>
            Você passa a tomar decisões com base em números reais — não feeling.
          </p>

          <div className="flex items-center gap-4 mb-8 text-sm" style={{ color: tokens.textMuted }}>
            <span style={{ color: tokens.green }} className="font-semibold">17 anos</span>
            de mercado unindo comunicação, performance e tecnologia.
          </div>

          <a
            href="#cta-final"
            className="group inline-flex items-center gap-3 px-7 py-4 rounded-xl font-medium text-[15px] transition-all relative overflow-hidden"
            style={{
              background: tokens.blue,
              color: "white",
              boxShadow: `0 0 0 0 ${tokens.blue}60, 0 8px 30px rgba(59,130,246,0.35)`,
              animation: "lp4-pulse 2.4s ease-in-out infinite",
            }}
          >
            Quero Diagnóstico Estratégico
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* CRM mock floating */}
        <div className="hero-mock relative">
          <div
            className="relative rounded-2xl p-6 backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* mock header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              </div>
              <span className="text-[10px] lowercase tracking-wider" style={{ color: tokens.textMuted }}>escale · pipeline</span>
            </div>

            {/* metrics row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "leads/mês", value: 1248, color: tokens.blue },
                { label: "conversão", value: 24, suffix: "%", color: tokens.green },
                { label: "ticket médio", value: 8497, prefix: "R$ ", color: tokens.purple },
              ].map((m) => (
                <div key={m.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="text-[10px] lowercase mb-1.5" style={{ color: tokens.textMuted }}>{m.label}</div>
                  <div className="text-lg font-semibold tracking-tight" style={{ color: m.color }}>
                    <CountUp end={m.value} prefix={m.prefix} suffix={m.suffix} />
                  </div>
                </div>
              ))}
            </div>

            {/* pipeline bars */}
            <div className="space-y-3">
              {["prospect", "qualificado", "proposta", "fechamento"].map((stage, i) => (
                <div key={stage}>
                  <div className="flex justify-between text-[11px] mb-1.5 lowercase" style={{ color: tokens.textMuted }}>
                    <span>{stage}</span>
                    <span style={{ color: tokens.text }}>{pipelineProgress[i]}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-[1400ms] ease-out"
                      style={{
                        width: `${pipelineProgress[i]}%`,
                        background: `linear-gradient(90deg, ${tokens.blue}, ${tokens.purple})`,
                        boxShadow: `0 0 12px ${tokens.blue}80`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI badge */}
            <div className="mt-6 flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg lowercase"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#86EFAC" }}>
              <Bot className="w-3.5 h-3.5" /> IA monitorando 12 oportunidades agora
            </div>
          </div>

          {/* glow behind mock */}
          <div className="absolute inset-0 -z-10 rounded-2xl"
            style={{ background: `radial-gradient(circle at 50% 50%, ${tokens.blue}30, transparent 70%)`, filter: "blur(40px)" }} />
        </div>
      </section>

      {/* ============== AUTORIDADE ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-2xl mb-14">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: tokens.blue }}>autoridade</div>
          <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight lowercase mb-5">
            experiência prática de quem já construiu resultado
          </h2>
          <p className="text-base lg:text-lg" style={{ color: tokens.textMuted }}>
            Há 17 anos ajudamos empresas de diferentes segmentos a vender mais através de estrutura, gestão e performance.
          </p>
        </div>

        <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Target, label: "Estratégia Comercial" },
            { icon: TrendingUp, label: "Growth e Aquisição" },
            { icon: BarChart3, label: "Gestão orientada por dados" },
            { icon: Zap, label: "Tecnologia aplicada ao negócio" },
            { icon: Settings, label: "Processos escaláveis" },
            { icon: Brain, label: "Inteligência operacional" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              data-stagger-item
              className="group flex items-center gap-3 p-5 rounded-xl backdrop-blur-md transition-all hover:translate-y-[-2px]"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: "rgba(59,130,246,0.1)", color: tokens.blue }}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============== DOR ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-3xl mb-16">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: "#F87171" }}>o problema</div>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase mb-4">
            o problema não é vender.
          </h2>
          <h3 className="text-2xl lg:text-3xl font-medium tracking-tight lowercase" style={{ color: tokens.textMuted }}>
            é crescer sem controle.
          </h3>
        </div>

        <p className="text-lg mb-10 max-w-2xl" style={{ color: tokens.textMuted }} data-reveal>
          Muitas empresas até faturam, mas operam no escuro. Não sabem:
        </p>

        <div data-stagger className="grid md:grid-cols-2 gap-3 max-w-3xl mb-16">
          {[
            "Quantos leads realmente entram",
            "Qual canal gera lucro",
            "Onde perdem vendas",
            "Taxa real de conversão",
            "Performance do time comercial",
            "Previsão real de receita",
            "Gargalos da operação",
          ].map((item) => (
            <div
              key={item}
              data-stagger-item
              className="flex items-center gap-3 py-3 px-4 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.blue }} />
              <span className="text-sm" style={{ color: tokens.text }}>{item}</span>
            </div>
          ))}
        </div>

        <div data-reveal className="rounded-2xl p-8 lg:p-10 backdrop-blur-md"
          style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)" }}>
          <div className="text-sm lowercase mb-5" style={{ color: "#FCA5A5" }}>resultado</div>
          <div data-stagger className="grid md:grid-cols-5 gap-4">
            {[
              "Crescimento inconsistente",
              "Decisões emocionais",
              "Equipe desalinhada",
              "Baixa margem",
              "Escala travada",
            ].map((r) => (
              <div key={r} data-stagger-item className="flex items-start gap-2">
                <X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#F87171" }} />
                <span className="text-sm">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== SOLUÇÃO ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-3xl mb-16">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: tokens.green }}>solução</div>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase mb-5">
            transformamos seu comercial em uma <span style={{ color: tokens.green }}>operação previsível</span>.
          </h2>
          <p className="text-lg" style={{ color: tokens.textMuted }}>
            Criamos a base estratégica e operacional para sua empresa crescer com clareza.
          </p>
        </div>

        <div data-stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Settings, label: "Processos comerciais definidos", color: tokens.blue },
            { icon: LineChart, label: "Indicadores em tempo real", color: tokens.green },
            { icon: Target, label: "Funil estruturado", color: tokens.blue },
            { icon: Users, label: "Time mais produtivo", color: tokens.purple },
            { icon: BarChart3, label: "Rotina de gestão clara", color: tokens.green },
            { icon: Database, label: "Tecnologia integrada", color: tokens.blue },
            { icon: Zap, label: "Automação operacional", color: tokens.purple },
            { icon: Brain, label: "Inteligência para decisão", color: tokens.green },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              data-stagger-item
              className="group p-6 rounded-xl backdrop-blur-md transition-all duration-300 hover:translate-y-[-3px]"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 30px ${color}30, 0 0 0 1px ${color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ background: `${color}15`, color }}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm leading-relaxed">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== CRM SECTION ============== */}
      <section className="crm-section relative z-10 py-24 lg:py-32"
        style={{ background: "linear-gradient(180deg, transparent, rgba(15,23,42,0.6), transparent)" }}>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          <div data-reveal className="max-w-3xl mb-16 text-center mx-auto">
            <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: tokens.blue }}>plataforma</div>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase mb-5">
              sua operação funcionando em <span style={{ color: tokens.blue }}>tempo real</span>
            </h2>
            <p className="text-lg" style={{ color: tokens.textMuted }}>
              Tenha controle total do seu marketing, vendas e crescimento em um só lugar.
            </p>
          </div>

          {/* Big mock */}
          <div data-reveal className="relative rounded-2xl p-6 lg:p-10 backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            }}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* leads */}
              <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[11px] lowercase mb-2" style={{ color: tokens.textMuted }}>leads gerados (mês)</div>
                <div className="text-3xl font-semibold tracking-tight mb-4" style={{ color: tokens.blue }}>
                  <CountUp end={1248} />
                </div>
                <div className="space-y-1.5">
                  {[80, 65, 90, 72, 88, 95, 70].map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="text-[9px] w-6" style={{ color: tokens.textMuted }}>D{i + 1}</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full transition-all duration-[1400ms]"
                          style={{ width: `${h}%`, background: tokens.blue, boxShadow: `0 0 8px ${tokens.blue}80` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* conversão */}
              <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[11px] lowercase mb-2" style={{ color: tokens.textMuted }}>conversão acompanhada</div>
                <div className="text-3xl font-semibold tracking-tight mb-4" style={{ color: tokens.green }}>
                  <CountUp end={24} suffix="%" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Visitantes", val: 100 },
                    { label: "Leads", val: 62 },
                    { label: "Qualificados", val: 38 },
                    { label: "Clientes", val: 24 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-[11px] mb-1 lowercase" style={{ color: tokens.textMuted }}>
                        <span>{s.label}</span>
                        <span>{s.val}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full transition-all duration-[1600ms]"
                          style={{ width: `${s.val}%`, background: `linear-gradient(90deg, ${tokens.green}, ${tokens.blue})` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IA + pipeline */}
              <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[11px] lowercase mb-2" style={{ color: tokens.textMuted }}>IA operando junto com seu time</div>
                <div className="text-3xl font-semibold tracking-tight mb-4" style={{ color: tokens.purple }}>
                  <CountUp end={342} suffix=" ações/dia" />
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Bot, label: "Follow-up automático", val: "89 hoje" },
                    { icon: Sparkles, label: "Scoring de leads", val: "tempo real" },
                    { icon: Brain, label: "Insights gerados", val: "12 hoje" },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: tokens.purple }} />
                        <span className="text-[11px]">{label}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: tokens.textMuted }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* feature bullets */}
          <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {["Pipeline de vendas organizado", "Leads sendo gerados diariamente", "Conversão sendo acompanhada", "IA operando junto com seu time"].map((f) => (
              <div key={f} data-stagger-item className="flex items-center gap-2 text-sm p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <Check className="w-4 h-4 shrink-0" style={{ color: tokens.green }} />
                <span style={{ color: tokens.textMuted }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== IA / OPERAÇÃO INTELIGENTE ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-3xl mb-16">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: tokens.purple }}>inteligência artificial</div>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase mb-5">
            sua operação <span style={{ color: tokens.purple }}>já nasce inteligente</span>
          </h2>
          <p className="text-lg" style={{ color: tokens.textMuted }}>
            Implementamos agentes treinados com contexto da empresa para acelerar produtividade.
          </p>
        </div>

        <div data-stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Comercial", icon: TrendingUp, items: ["Assistente de vendas", "Follow-up inteligente", "Apoio ao time comercial"] },
            { title: "Marketing", icon: Sparkles, items: ["Copywriter IA", "Conteúdo estratégico", "Criativos"] },
            { title: "Gestão", icon: BarChart3, items: ["Relatórios automáticos", "Insights de performance", "Alertas estratégicos"] },
            { title: "RH", icon: Users, items: ["Recrutamento e seleção"] },
          ].map(({ title, icon: Icon, items }) => (
            <div
              key={title}
              data-stagger-item
              className="rounded-xl p-6 backdrop-blur-md transition-all hover:translate-y-[-3px]"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "rgba(99,102,241,0.12)", color: tokens.purple }}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight lowercase mb-4">{title}</h3>
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm" style={{ color: tokens.textMuted }}>
                    <CircleDot className="w-3 h-3 mt-1 shrink-0" style={{ color: tokens.purple }} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ============== METODOLOGIA ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-3xl mb-16">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: tokens.blue }}>metodologia escale</div>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase">
            como entregamos isso em <span style={{ color: tokens.green }}>menos de 30 dias</span>
          </h2>
        </div>

        {/* timeline */}
        <div className="relative">
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, ${tokens.blue}, ${tokens.purple}, ${tokens.green})` }} />

          <div data-stagger className="grid lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Diagnóstico Estratégico",
                desc: "Mergulho completo no negócio para mapear cenário atual e oportunidades.",
                items: ["Diagnóstico da empresa", "Análise de mercado", "Concorrência", "Posicionamento", "Oportunidades comerciais", "Comunicação estratégica", "Planejamento macro de crescimento"],
              },
              {
                step: "02",
                title: "Estruturação Comercial",
                desc: "Organizamos a operação de vendas.",
                items: ["Funil comercial", "Etapas de vendas", "Scripts", "Playbook comercial", "Tabela de objeções", "Cadência de follow-up", "KPIs comerciais", "Metas e indicadores"],
              },
              {
                step: "03",
                title: "Aquisição e Crescimento",
                desc: "Planejamento de geração de demanda.",
                items: ["Estratégia de mídia", "Meta Ads / Google Ads", "KPIs", "Plano trimestral", "Criativos", "Escala previsível"],
              },
              {
                step: "04",
                title: "Operação Inteligente",
                desc: "Implementação da estrutura de gestão.",
                items: ["Central comercial integrada", "Dashboard executivo", "Automação de processos", "Gestão de leads", "Landing page de captação", "IA aplicada ao negócio", "Relatórios gerenciais"],
              },
            ].map(({ step, title, desc, items }) => (
              <div key={step} data-stagger-item className="relative">
                <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md"
                  style={{
                    background: "rgba(15,23,42,0.9)",
                    border: `1px solid ${tokens.blue}40`,
                    boxShadow: `0 0 30px ${tokens.blue}30`,
                  }}>
                  <span className="text-lg font-semibold" style={{ color: tokens.blue }}>{step}</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight lowercase mb-2">{title}</h3>
                <p className="text-sm mb-4" style={{ color: tokens.textMuted }}>{desc}</p>
                <ul className="space-y-1.5">
                  {items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-[13px]">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: tokens.green }} />
                      <span style={{ color: tokens.textMuted }}>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center mt-12 text-sm lowercase" style={{ color: tokens.textMuted }} data-reveal>
          baseado no método escale
        </p>
      </section>

      {/* ============== CRONOGRAMA ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-3xl mb-16">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: tokens.green }}>cronograma</div>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase">
            tudo estruturado em <span style={{ color: tokens.green }}>30 dias</span>
          </h2>
        </div>

        <div data-stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { week: "Semana 1", title: "Diagnóstico Estratégico" },
            { week: "Semana 2", title: "Estruturação Comercial" },
            { week: "Semana 3", title: "Plano de Mídia" },
            { week: "Semana 4", title: "CRM + Landing Page + Escala" },
          ].map(({ week, title }, i) => (
            <div
              key={week}
              data-stagger-item
              className="relative rounded-xl p-6 backdrop-blur-md transition-all hover:translate-y-[-3px]"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="text-[11px] lowercase tracking-wider mb-3" style={{ color: tokens.blue }}>{week}</div>
              <h3 className="text-lg font-semibold tracking-tight lowercase mb-4">{title}</h3>
              <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full" style={{ width: `${(i + 1) * 25}%`, background: `linear-gradient(90deg, ${tokens.blue}, ${tokens.green})` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-lg lowercase" style={{ color: tokens.text }} data-reveal>
          você sai com tudo pronto. <span style={{ color: tokens.green }}>não é teoria.</span>
        </p>
      </section>

      {/* ============== COMPARATIVO ============== */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div data-reveal className="max-w-3xl mb-16">
          <div className="text-xs lowercase tracking-[0.2em] mb-4" style={{ color: "#FBBF24" }}>comparativo</div>
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase">
            quanto custaria montar tudo isso <span style={{ color: "#FBBF24" }}>separado?</span>
          </h2>
        </div>

        <div data-reveal className="rounded-2xl overflow-hidden backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-3 px-6 py-4 text-[11px] lowercase tracking-wider"
            style={{ color: tokens.textMuted, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="col-span-2">estrutura / serviço</span>
            <span className="text-right">valor médio</span>
          </div>

          <div data-stagger>
            {[
              { label: "Planejamento Estratégico", val: 5500 },
              { label: "Consultoria Comercial", val: 4500 },
              { label: "Plano de Aquisição", val: 3500 },
              { label: "Landing Page Estratégica", val: 3500 },
              { label: "Plataforma + Setup", val: 5400 },
              { label: "Implementação Operacional", val: 3800 },
              { label: "Infraestrutura Técnica", val: 2400 },
              { label: "Estrutura de Funil", val: 3100 },
              { label: "Copywriting Comercial", val: 3500 },
            ].map((row) => (
              <div
                key={row.label}
                data-stagger-item
                className="grid grid-cols-3 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="col-span-2 text-sm">{row.label}</span>
                <span className="text-right text-sm tabular-nums" style={{ color: tokens.textMuted }}>
                  <CountUp end={row.val} prefix="R$ " />
                </span>
              </div>
            ))}

            {/* Totals */}
            <div className="px-6 py-5 grid grid-cols-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="col-span-2 text-sm lowercase" style={{ color: tokens.textMuted }}>total no mercado</span>
              <span className="text-right text-lg font-semibold tabular-nums line-through" style={{ color: "#9CA3AF" }}>
                <CountUp end={35200} prefix="R$ " />
              </span>
            </div>
            <div className="px-6 py-5 grid grid-cols-3" style={{ background: "rgba(34,197,94,0.05)", borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
              <span className="col-span-2 text-base lowercase font-medium">com a escale</span>
              <span className="text-right text-2xl font-semibold tabular-nums" style={{ color: tokens.green, textShadow: `0 0 20px ${tokens.green}80` }}>
                <CountUp end={8497} prefix="R$ " />
              </span>
            </div>
            <div className="px-6 py-5 grid grid-cols-3">
              <span className="col-span-2 text-sm lowercase" style={{ color: tokens.textMuted }}>economia superior a</span>
              <span className="text-right text-xl font-semibold tabular-nums" style={{ color: tokens.green }}>
                <CountUp end={26700} prefix="R$ " />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PROVA DE VALOR ============== */}
      <section className="relative z-10 py-32 lg:py-40" style={{ background: "rgba(10,15,28,0.6)" }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 data-reveal className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase leading-[1.1] mb-8">
            você não contrata ferramentas.
            <br />
            contrata <span style={{ color: tokens.green }}>clareza</span>, <span style={{ color: tokens.blue }}>controle</span> e <span style={{ color: tokens.purple }}>crescimento</span>.
          </h2>
          <div data-reveal className="text-lg lg:text-xl space-y-2" style={{ color: tokens.textMuted }}>
            <p>tecnologia sem estratégia vira custo.</p>
            <p style={{ color: tokens.text }}>estrutura bem construída vira lucro.</p>
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section id="cta-final" className="relative z-10 py-32 lg:py-40">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <div className="absolute inset-0 -z-10 max-w-3xl mx-auto"
            style={{ background: `radial-gradient(circle at 50% 50%, ${tokens.blue}25, transparent 60%)`, filter: "blur(60px)" }} />

          <Rocket className="w-10 h-10 mx-auto mb-6" style={{ color: tokens.blue }} data-reveal />

          <h2 data-reveal className="text-4xl lg:text-6xl font-semibold tracking-tight lowercase leading-[1.1] mb-6">
            se sua empresa quer crescer com <span style={{ color: tokens.green }}>previsibilidade</span>, fale com a escale.
          </h2>

          <p data-reveal className="text-lg mb-12" style={{ color: tokens.textMuted }}>
            Vamos mostrar onde estão os gargalos e como estruturar uma operação que escala.
          </p>

          <a
            data-reveal
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-8 py-5 rounded-xl font-medium text-base transition-all relative overflow-hidden hover:scale-[1.03]"
            style={{
              background: tokens.blue,
              color: "white",
              boxShadow: `0 0 0 0 ${tokens.blue}80, 0 12px 40px rgba(59,130,246,0.45)`,
              animation: "lp4-pulse 2.4s ease-in-out infinite",
            }}
          >
            Quero meu Diagnóstico Estratégico
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </a>

          <p data-reveal className="mt-10 text-xs lowercase tracking-wider" style={{ color: tokens.textMuted }}>
            17 anos · estratégia · performance · tecnologia
          </p>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 py-10 text-center text-xs lowercase tracking-wider" style={{ color: tokens.textMuted, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        © escale · sistema operacional de crescimento previsível
      </footer>

      {/* keyframes */}
      <style>{`
        @keyframes lp4-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${tokens.blue}50, 0 8px 30px rgba(59,130,246,0.35); }
          50% { box-shadow: 0 0 0 12px ${tokens.blue}00, 0 8px 30px rgba(59,130,246,0.45); }
        }
      `}</style>
    </div>
  );
}
