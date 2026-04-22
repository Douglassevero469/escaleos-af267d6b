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

/* ---------- Design tokens (LP4 — Deep Blue / White) ---------- */
const t = {
  navy: "#0A1A3F",
  navyDeep: "#050E26",
  navyMid: "#13265C",
  blue: "#2B5BFF",
  blueLight: "#5B82FF",
  white: "#FFFFFF",
  offWhite: "#F5F6FA",
  ink: "#0A1428",
  inkMuted: "#5B6478",
  border: "#E6E8EF",
  textOnDark: "#E8ECF7",
  textOnDarkMuted: "#A0ABCC",
};

/* ---------- Count up ---------- */
function CountUp({
  end,
  prefix = "",
  suffix = "",
  duration = 1.6,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
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
  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

/* ---------- Page ---------- */
export default function LP4() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pipelineProgress, setPipelineProgress] = useState([0, 0, 0, 0]);

  // SEO
  useEffect(() => {
    document.title = "Escale — Crescimento previsível para o seu comercial";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Organize seu comercial com processos, indicadores e tecnologia. Crescimento previsível em 30 dias.",
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

  // Reveals
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((parent) => {
        const items = parent.querySelectorAll("[data-stagger-item]");
        gsap.from(items, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: parent, start: "top 88%" },
        });
      });

      // Hero progressive reveal
      gsap.from(".hero-headline span", {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.15,
      });
      gsap.from(".hero-mock", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.4,
      });

      // Stack-on-scroll
      gsap.utils.toArray<HTMLElement>(".stack-section").forEach((section) => {
        gsap.from(section, {
          y: 80,
          scale: 0.985,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 60%",
            scrub: true,
          },
        });
      });

      // Pipeline animation
      ScrollTrigger.create({
        trigger: ".crm-section",
        start: "top 70%",
        once: true,
        onEnter: () => setPipelineProgress([78, 62, 45, 30]),
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen relative text-[17px] lg:text-[18px] leading-relaxed"
      style={{
        background: t.navyDeep,
        color: t.textOnDark,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ============== TOP NAV ============== */}
      <header className="relative z-30 max-w-[1280px] mx-auto px-6 lg:px-10 py-7 flex items-center justify-between">
        <div className="text-base font-semibold tracking-tight lowercase flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-5 rounded-[6px]"
            style={{ background: `linear-gradient(135deg, ${t.blue}, ${t.blueLight})` }}
          />
          escale
          <sup className="text-[9px] font-normal opacity-60">®</sup>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[14px]" style={{ color: t.textOnDarkMuted }}>
          <a href="#solucao" className="hover:text-white transition-colors">solução</a>
          <a href="#metodologia" className="hover:text-white transition-colors">metodologia</a>
          <a href="#valores" className="hover:text-white transition-colors">valores</a>
        </nav>
        <a
          href="#cta-final"
          className="text-[13px] lowercase tracking-wide px-4 py-2 rounded-full transition-all hover:scale-[1.02]"
          style={{ background: t.white, color: t.ink }}
        >
          falar com especialista
        </a>
      </header>

      {/* ============== HERO ============== */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${t.navyMid} 0%, ${t.navy} 40%, ${t.navyDeep} 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-60"
          style={{ background: `radial-gradient(circle, ${t.blue}30, transparent 70%)`, filter: "blur(80px)" }}
        />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 pb-32 lg:pt-20 lg:pb-44 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <h1 className="hero-headline text-[44px] lg:text-[80px] leading-[1.02] font-semibold tracking-[-0.035em] mb-10">
              <span className="block" style={{ color: "rgba(232,236,247,0.45)" }}>
                Seu comercial cresce
              </span>
              <span className="block">por estratégia</span>
              <span className="block">ou por achismo?</span>
            </h1>

            <p className="text-lg lg:text-xl leading-relaxed mb-5 max-w-2xl" style={{ color: t.textOnDarkMuted }}>
              Organizamos o setor comercial da sua empresa com processos, indicadores, inteligência operacional e
              tecnologia aplicada para gerar crescimento previsível.
            </p>
            <p className="text-lg lg:text-xl mb-12 max-w-2xl" style={{ color: t.white }}>
              Você passa a tomar decisões com base em números reais — não feeling.
            </p>

            {/* 17 anos — destaque */}
            <div
              className="inline-flex flex-wrap items-center gap-3 px-5 py-3 rounded-2xl mb-10"
              style={{
                background: "rgba(43,91,255,0.10)",
                border: "1px solid rgba(91,130,255,0.30)",
              }}
            >
              <span
                className="text-2xl lg:text-3xl font-semibold tracking-tight"
                style={{ color: t.white }}
              >
                17 anos
              </span>
              <span className="text-sm lg:text-base" style={{ color: t.textOnDarkMuted }}>
                de mercado unindo
              </span>
              <span className="text-sm lg:text-base font-medium" style={{ color: t.blueLight }}>
                comunicação · performance · tecnologia
              </span>
              <span className="text-sm lg:text-base" style={{ color: t.textOnDarkMuted }}>
                para escalar empresas.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a
                href="#cta-final"
                className="group inline-flex items-center gap-3 px-8 py-5 rounded-full font-medium text-base transition-all hover:scale-[1.02]"
                style={{
                  background: t.white,
                  color: t.ink,
                  boxShadow: "0 10px 40px rgba(255,255,255,0.15)",
                }}
              >
                Quero Diagnóstico Estratégico
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Floating CRM mock */}
          <div className="hero-mock lg:col-span-5 relative">
            <div
              className="relative rounded-2xl p-6 backdrop-blur-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.blue }} />
                </div>
                <span className="text-[11px] lowercase tracking-wider" style={{ color: t.textOnDarkMuted }}>
                  escale · pipeline
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "leads/mês", value: 1248 },
                  { label: "conversão", value: 24, suffix: "%" },
                  { label: "ticket médio", value: 8497, prefix: "R$ " },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="text-[11px] lowercase mb-1.5" style={{ color: t.textOnDarkMuted }}>
                      {m.label}
                    </div>
                    <div className="text-base font-semibold tracking-tight" style={{ color: t.white }}>
                      <CountUp end={m.value} prefix={m.prefix} suffix={m.suffix} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {["prospect", "qualificado", "proposta", "fechamento"].map((stage, i) => (
                  <div key={stage}>
                    <div className="flex justify-between text-[12px] mb-1.5 lowercase" style={{ color: t.textOnDarkMuted }}>
                      <span>{stage}</span>
                      <span style={{ color: t.white }}>{pipelineProgress[i]}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-[1400ms] ease-out"
                        style={{
                          width: `${pipelineProgress[i]}%`,
                          background: `linear-gradient(90deg, ${t.blue}, ${t.blueLight})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg lowercase"
                style={{
                  background: "rgba(43,91,255,0.12)",
                  border: "1px solid rgba(43,91,255,0.25)",
                  color: t.blueLight,
                }}
              >
                <Bot className="w-3.5 h-3.5" /> IA monitorando 12 oportunidades agora
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== AUTORIDADE — title+text à esquerda, slot de form à direita ============== */}
      <section
        id="solucao"
        className="stack-section relative z-10 -mt-10 rounded-t-[40px] lg:rounded-t-[56px]"
        style={{ background: t.white, color: t.ink }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Esquerda: título + texto */}
            <div className="lg:col-span-7">
              <h2
                data-reveal
                className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] mb-8"
              >
                Experiência prática de quem já construiu resultado
              </h2>

              <p data-reveal className="text-lg lg:text-xl leading-relaxed mb-10" style={{ color: t.inkMuted }}>
                Há <span style={{ color: t.ink, fontWeight: 600 }}>17 anos</span> ajudamos empresas de diferentes
                segmentos a vender mais através de estrutura, gestão e performance.
              </p>

              <p data-reveal className="text-lg lg:text-xl mb-6" style={{ color: t.ink, fontWeight: 500 }}>
                Atuamos na interseção entre:
              </p>

              <div data-stagger className="grid sm:grid-cols-2 gap-3">
                {[
                  "Estratégia Comercial",
                  "Growth e Aquisição",
                  "Gestão orientada por dados",
                  "Tecnologia aplicada ao negócio",
                  "Processos escaláveis",
                  "Inteligência operacional",
                ].map((label) => (
                  <div
                    key={label}
                    data-stagger-item
                    className="flex items-center gap-3 py-3"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${t.blue}15` }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: t.blue }} />
                    </div>
                    <span className="text-base lg:text-lg" style={{ color: t.ink }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direita: slot de formulário (placeholder funcional para embed) */}
            <div className="lg:col-span-5 lg:sticky lg:top-10" data-reveal>
              <div
                id="form-embed-slot"
                className="rounded-2xl p-8 lg:p-10"
                style={{
                  background: t.offWhite,
                  border: `1px solid ${t.border}`,
                }}
              >
                <div className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: t.blue }}>
                  formulário
                </div>
                <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-3" style={{ color: t.ink }}>
                  Solicite seu Diagnóstico
                </h3>
                <p className="text-base mb-6" style={{ color: t.inkMuted }}>
                  Preencha seus dados e nossa equipe entra em contato.
                </p>

                {/* Espaço reservado para embed do formulário */}
                <div
                  className="rounded-xl flex items-center justify-center text-center text-sm px-6 py-12"
                  style={{
                    background: t.white,
                    border: `1px dashed ${t.border}`,
                    color: t.inkMuted,
                    minHeight: 320,
                  }}
                >
                  Espaço reservado para embedar o formulário aqui.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== DOR — centralizada ============== */}
      <section
        className="stack-section relative z-20 -mt-10 rounded-t-[40px] lg:rounded-t-[56px] overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${t.navyMid} 0%, ${t.navy} 50%, ${t.navyDeep} 100%)`,
          color: t.textOnDark,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-24 lg:py-36 text-center">
          <h2
            data-reveal
            className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] mb-6"
          >
            <span style={{ color: t.textOnDarkMuted }}>O problema não é vender.</span>
            <br />É crescer sem controle.
          </h2>

          <p
            data-reveal
            className="text-lg lg:text-xl mb-14 max-w-2xl mx-auto"
            style={{ color: t.textOnDarkMuted }}
          >
            Muitas empresas até faturam, mas operam no escuro.
          </p>

          <p
            data-reveal
            className="text-base lg:text-lg uppercase tracking-[0.25em] mb-8"
            style={{ color: t.blueLight }}
          >
            Não sabem
          </p>

          <div data-stagger className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-16">
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
                className="flex items-center gap-3 py-4 px-5 rounded-xl text-left"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <CircleDot className="w-4 h-4 shrink-0" style={{ color: t.blueLight }} />
                <span className="text-base" style={{ color: t.textOnDark }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <p
            data-reveal
            className="text-base lg:text-lg uppercase tracking-[0.25em] mb-8"
            style={{ color: t.blueLight }}
          >
            Resultado
          </p>

          <div data-stagger className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              "Crescimento inconsistente",
              "Decisões emocionais",
              "Equipe desalinhada",
              "Baixa margem",
              "Escala travada",
            ].map((r) => (
              <div
                key={r}
                data-stagger-item
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <X className="w-4 h-4 shrink-0" style={{ color: t.blueLight }} />
                <span className="text-base" style={{ color: t.textOnDark }}>
                  {r}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== SOLUÇÃO ============== */}
      <section
        className="stack-section relative z-30 -mt-10 rounded-t-[40px] lg:rounded-t-[56px]"
        style={{ background: t.white, color: t.ink }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-4xl mb-16">
            <h2
              data-reveal
              className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] mb-6"
            >
              Nós transformamos seu comercial em uma{" "}
              <span style={{ color: t.blue }}>operação previsível</span>.
            </h2>
            <p data-reveal className="text-lg lg:text-xl" style={{ color: t.inkMuted }}>
              Criamos a base estratégica e operacional para sua empresa crescer com clareza.
            </p>
            <p data-reveal className="text-lg lg:text-xl mt-6 font-medium" style={{ color: t.ink }}>
              Você recebe:
            </p>
          </div>

          <div
            data-stagger
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-px"
            style={{ background: t.border }}
          >
            {[
              { icon: Settings, label: "Processos comerciais definidos" },
              { icon: LineChart, label: "Indicadores em tempo real" },
              { icon: Target, label: "Funil estruturado" },
              { icon: Users, label: "Time mais produtivo" },
              { icon: BarChart3, label: "Rotina de gestão clara" },
              { icon: Database, label: "Tecnologia integrada" },
              { icon: Zap, label: "Automação operacional" },
              { icon: Brain, label: "Inteligência para tomada de decisão" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                data-stagger-item
                className="group p-7 transition-all hover:bg-[#FAFBFE]"
                style={{ background: t.white }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: `${t.blue}10`, color: t.blue }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-base leading-relaxed font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CRM SECTION ============== */}
      <section
        className="crm-section stack-section relative z-40 -mt-10 rounded-t-[40px] lg:rounded-t-[56px] overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${t.navyMid} 0%, ${t.navy} 50%, ${t.navyDeep} 100%)`,
          color: t.textOnDark,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-36">
          <div data-reveal className="max-w-3xl mb-16">
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05]">
              Sua operação funcionando em <span style={{ color: t.blueLight }}>tempo real</span>
            </h2>
            <p className="text-lg lg:text-xl mt-6" style={{ color: t.textOnDarkMuted }}>
              Tenha controle total do seu marketing, vendas e crescimento em um só lugar.
            </p>
          </div>

          <div
            data-reveal
            className="relative rounded-3xl p-6 lg:p-10"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            }}
          >
            <div className="grid lg:grid-cols-3 gap-6">
              {/* leads */}
              <div
                className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-[12px] lowercase mb-2" style={{ color: t.textOnDarkMuted }}>
                  leads gerados (mês)
                </div>
                <div className="text-3xl font-semibold tracking-tight mb-4" style={{ color: t.white }}>
                  <CountUp end={1248} />
                </div>
                <div className="space-y-1.5">
                  {[80, 65, 90, 72, 88, 95, 70].map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="text-[10px] w-6" style={{ color: t.textOnDarkMuted }}>
                        D{i + 1}
                      </div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-[1400ms]"
                          style={{ width: `${h}%`, background: t.blue }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* conversão */}
              <div
                className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-[12px] lowercase mb-2" style={{ color: t.textOnDarkMuted }}>
                  conversão acompanhada
                </div>
                <div className="text-3xl font-semibold tracking-tight mb-4" style={{ color: t.white }}>
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
                      <div
                        className="flex justify-between text-[12px] mb-1 lowercase"
                        style={{ color: t.textOnDarkMuted }}
                      >
                        <span>{s.label}</span>
                        <span>{s.val}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-[1600ms]"
                          style={{
                            width: `${s.val}%`,
                            background: `linear-gradient(90deg, ${t.blueLight}, ${t.blue})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IA */}
              <div
                className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-[12px] lowercase mb-2" style={{ color: t.textOnDarkMuted }}>
                  IA operando junto com seu time
                </div>
                <div className="text-3xl font-semibold tracking-tight mb-4" style={{ color: t.white }}>
                  <CountUp end={342} suffix=" ações/dia" />
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Bot, label: "Follow-up automático", val: "89 hoje" },
                    { icon: Sparkles, label: "Scoring de leads", val: "tempo real" },
                    { icon: Brain, label: "Insights gerados", val: "12 hoje" },
                  ].map(({ icon: Icon, label, val }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: "rgba(43,91,255,0.08)", border: "1px solid rgba(43,91,255,0.18)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: t.blueLight }} />
                        <span className="text-[12px]">{label}</span>
                      </div>
                      <span className="text-[11px]" style={{ color: t.textOnDarkMuted }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* feature bullets */}
          <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {[
              "Pipeline de vendas organizado",
              "Leads sendo gerados diariamente",
              "Conversão sendo acompanhada",
              "IA operando junto com seu time",
            ].map((f) => (
              <div
                key={f}
                data-stagger-item
                className="flex items-center gap-2 text-base p-4 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Check className="w-4 h-4 shrink-0" style={{ color: t.blueLight }} />
                <span style={{ color: t.textOnDark }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== IA / OPERAÇÃO INTELIGENTE ============== */}
      <section
        className="stack-section relative z-50 -mt-10 rounded-t-[40px] lg:rounded-t-[56px]"
        style={{ background: t.white, color: t.ink }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-4xl mb-16">
            <h2
              data-reveal
              className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] mb-6"
            >
              Sua operação <span style={{ color: t.blue }}>já nasce inteligente</span>
            </h2>
            <p data-reveal className="text-lg lg:text-xl" style={{ color: t.inkMuted }}>
              Implementamos agentes treinados com contexto da empresa para acelerar produtividade.
            </p>
          </div>

          <div data-stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: t.border }}>
            {[
              {
                title: "Comercial",
                icon: TrendingUp,
                items: ["Assistente de vendas", "Follow-up inteligente", "Apoio ao time comercial"],
              },
              { title: "Marketing", icon: Sparkles, items: ["Copywriter IA", "Conteúdo estratégico", "Criativos"] },
              {
                title: "Gestão",
                icon: BarChart3,
                items: ["Relatórios automáticos", "Insights de performance", "Alertas estratégicos"],
              },
              { title: "RH", icon: Users, items: ["Recrutamento e seleção"] },
            ].map(({ title, icon: Icon, items }) => (
              <div
                key={title}
                data-stagger-item
                className="p-7 transition-all hover:bg-[#FAFBFE]"
                style={{ background: t.white }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ background: `${t.blue}10`, color: t.blue }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-4">{title}</h3>
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-base" style={{ color: t.inkMuted }}>
                      <CircleDot className="w-3 h-3 mt-1.5 shrink-0" style={{ color: t.blue }} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== METODOLOGIA ============== */}
      <section
        id="metodologia"
        className="stack-section relative z-[60] -mt-10 rounded-t-[40px] lg:rounded-t-[56px] overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 30% 0%, ${t.navyMid} 0%, ${t.navy} 50%, ${t.navyDeep} 100%)`,
          color: t.textOnDark,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-36">
          <div data-reveal className="max-w-3xl mb-16">
            <p className="text-base lg:text-lg uppercase tracking-[0.25em] mb-5" style={{ color: t.blueLight }}>
              Metodologia Escale
            </p>
            <h2 className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05]">
              Como entregamos isso em <span style={{ color: t.blueLight }}>menos de 30 dias</span>
            </h2>
          </div>

          <div className="relative">
            <div
              className="hidden lg:block absolute top-8 left-0 right-0 h-px"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />

            <div data-stagger className="grid lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Diagnóstico Estratégico",
                  desc: "Mergulho completo no negócio para mapear cenário atual e oportunidades.",
                  items: [
                    "Diagnóstico da empresa",
                    "Análise de mercado",
                    "Concorrência",
                    "Posicionamento",
                    "Oportunidades comerciais",
                    "Comunicação estratégica",
                    "Planejamento macro de crescimento",
                  ],
                },
                {
                  step: "02",
                  title: "Estruturação Comercial",
                  desc: "Organizamos a operação de vendas.",
                  items: [
                    "Funil comercial",
                    "Etapas de vendas",
                    "Scripts",
                    "Playbook comercial",
                    "Tabela de objeções",
                    "Cadência de follow-up",
                    "KPIs comerciais",
                    "Metas e indicadores",
                  ],
                },
                {
                  step: "03",
                  title: "Aquisição e Crescimento",
                  desc: "Planejamento de geração de demanda.",
                  items: [
                    "Estratégia de mídia",
                    "Meta Ads / Google Ads",
                    "KPIs",
                    "Plano trimestral",
                    "Criativos",
                    "Escala previsível",
                  ],
                },
                {
                  step: "04",
                  title: "Operação Inteligente",
                  desc: "Implementação da estrutura de gestão.",
                  items: [
                    "Central comercial integrada",
                    "Dashboard executivo",
                    "Automação de processos",
                    "Gestão de leads",
                    "Landing page de captação",
                    "IA aplicada ao negócio",
                    "Relatórios gerenciais",
                  ],
                },
              ].map(({ step, title, desc, items }) => (
                <div key={step} data-stagger-item className="relative">
                  <div
                    className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: t.navyDeep,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <span className="text-lg font-semibold" style={{ color: t.blueLight }}>
                      {step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight mb-2">{title}</h3>
                  <p className="text-base mb-4" style={{ color: t.textOnDarkMuted }}>
                    {desc}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-[14px]">
                        <Check className="w-3.5 h-3.5 mt-1 shrink-0" style={{ color: t.blueLight }} />
                        <span style={{ color: t.textOnDarkMuted }}>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-16 text-base" style={{ color: t.textOnDarkMuted }} data-reveal>
            Baseado no método Escale.
          </p>

          {/* Cronograma */}
          <div className="mt-24">
            <h3 data-reveal className="text-3xl lg:text-5xl font-semibold tracking-[-0.025em] mb-10">
              Tudo estruturado em <span style={{ color: t.blueLight }}>30 dias</span>
            </h3>

            <div data-stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.08)" }}>
              {[
                { week: "Semana 1", title: "Diagnóstico Estratégico" },
                { week: "Semana 2", title: "Estruturação Comercial" },
                { week: "Semana 3", title: "Plano de Mídia" },
                { week: "Semana 4", title: "CRM + Landing Page + Escala" },
              ].map(({ week, title }, i) => (
                <div
                  key={week}
                  data-stagger-item
                  className="relative p-7"
                  style={{ background: t.navy }}
                >
                  <div
                    className="text-[11px] uppercase tracking-[0.25em] mb-3"
                    style={{ color: t.blueLight }}
                  >
                    {week}
                  </div>
                  <h4 className="text-lg font-semibold tracking-tight mb-5">{title}</h4>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(i + 1) * 25}%`, background: t.blueLight }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-lg mt-8" style={{ color: t.textOnDark }} data-reveal>
              Você sai com tudo pronto. <span style={{ color: t.blueLight }}>Não é teoria.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ============== COMPARATIVO ============== */}
      <section
        id="valores"
        className="stack-section relative z-[70] -mt-10 rounded-t-[40px] lg:rounded-t-[56px]"
        style={{ background: t.offWhite, color: t.ink }}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-4xl mb-16">
            <h2
              data-reveal
              className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05]"
            >
              Quanto custaria montar tudo isso <span style={{ color: t.blue }}>separado?</span>
            </h2>
          </div>

          <div
            data-reveal
            className="rounded-2xl overflow-hidden"
            style={{ background: t.white, border: `1px solid ${t.border}` }}
          >
            <div
              className="grid grid-cols-3 px-6 py-4 text-[12px] uppercase tracking-[0.18em]"
              style={{ color: t.inkMuted, borderBottom: `1px solid ${t.border}` }}
            >
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
                  className="grid grid-cols-3 px-6 py-4 transition-colors hover:bg-[#FAFBFE]"
                  style={{ borderBottom: `1px solid ${t.border}` }}
                >
                  <span className="col-span-2 text-base">{row.label}</span>
                  <span className="text-right text-base tabular-nums" style={{ color: t.inkMuted }}>
                    <CountUp end={row.val} prefix="R$ " />
                  </span>
                </div>
              ))}

              <div
                className="px-6 py-5 grid grid-cols-3"
                style={{ borderBottom: `1px solid ${t.border}` }}
              >
                <span className="col-span-2 text-base" style={{ color: t.inkMuted }}>
                  Total no mercado
                </span>
                <span
                  className="text-right text-lg font-semibold tabular-nums line-through"
                  style={{ color: t.inkMuted }}
                >
                  <CountUp end={35200} prefix="R$ " />
                </span>
              </div>

              <div
                className="px-6 py-6 grid grid-cols-3"
                style={{ background: t.navy, color: t.white }}
              >
                <span className="col-span-2 text-base font-medium">Com a Escale</span>
                <span className="text-right text-2xl font-semibold tabular-nums">
                  <CountUp end={8497} prefix="R$ " />
                </span>
              </div>

              <div className="px-6 py-5 grid grid-cols-3">
                <span className="col-span-2 text-base" style={{ color: t.inkMuted }}>
                  Economia superior a
                </span>
                <span className="text-right text-xl font-semibold tabular-nums" style={{ color: t.blue }}>
                  <CountUp end={26700} prefix="R$ " />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PROVA DE VALOR ============== */}
      <section
        className="stack-section relative z-[80] -mt-10 rounded-t-[40px] lg:rounded-t-[56px] overflow-hidden"
        style={{
          background: t.navyDeep,
          color: t.textOnDark,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-32 lg:py-44 text-center">
          <h2
            data-reveal
            className="text-4xl lg:text-7xl font-semibold tracking-[-0.035em] leading-[1.05] mb-12"
          >
            Você não contrata ferramentas.
            <br />
            Contrata <span style={{ color: t.blueLight }}>clareza</span>,{" "}
            <span style={{ color: t.blueLight }}>controle</span> e{" "}
            <span style={{ color: t.blueLight }}>crescimento</span>.
          </h2>
          <div data-reveal className="text-xl lg:text-2xl space-y-3" style={{ color: t.textOnDarkMuted }}>
            <p>Tecnologia sem estratégia vira custo.</p>
            <p style={{ color: t.white }}>Estrutura bem construída vira lucro.</p>
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section
        id="cta-final"
        className="stack-section relative z-[90] -mt-10 rounded-t-[40px] lg:rounded-t-[56px]"
        style={{ background: t.white, color: t.ink }}
      >
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-32 lg:py-44 text-center relative">
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${t.blue}15, transparent 60%)`,
              filter: "blur(60px)",
            }}
          />

          <Rocket className="w-10 h-10 mx-auto mb-6" style={{ color: t.blue }} data-reveal />

          <h2
            data-reveal
            className="text-4xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] mb-8"
          >
            Se sua empresa quer crescer com <span style={{ color: t.blue }}>previsibilidade</span>, fale com a Escale.
          </h2>

          <p data-reveal className="text-lg lg:text-xl mb-12" style={{ color: t.inkMuted }}>
            Vamos mostrar onde estão os gargalos e como estruturar uma operação que escala.
          </p>

          <a
            data-reveal
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-8 py-5 rounded-full font-medium text-lg transition-all hover:scale-[1.03]"
            style={{
              background: t.blue,
              color: t.white,
              boxShadow: `0 12px 40px ${t.blue}40`,
              animation: "lp4-pulse 2.4s ease-in-out infinite",
            }}
          >
            Quero meu Diagnóstico Estratégico
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </a>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer
        className="relative z-[100] py-10 text-center text-sm lowercase tracking-wider"
        style={{ background: t.white, color: t.inkMuted, borderTop: `1px solid ${t.border}` }}
      >
        © escale
      </footer>

      {/* keyframes */}
      <style>{`
        @keyframes lp4-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${t.blue}50, 0 12px 40px ${t.blue}40; }
          50% { box-shadow: 0 0 0 14px ${t.blue}00, 0 12px 40px ${t.blue}55; }
        }
      `}</style>
    </div>
  );
}
