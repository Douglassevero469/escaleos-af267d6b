import { useState, useEffect, useRef } from "react";
import { MessageCircle, ChevronDown, CheckCircle2, XCircle, ArrowRight, Star, Clock, AlertTriangle, Flame, Target, TrendingUp, Zap, Phone } from "lucide-react";

/* ─── Utility: scroll-triggered entrance ─── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── Animated counter ─── */
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return { count, ref };
}

const WA_LINK = "https://wa.me/5500000000000?text=Quero%20saber%20mais%20sobre%20o%20Super%20Pacote%20Escale";

/* ─── Pain points ─── */
const painPoints = [
  "Você já investiu em marketing e não viu retorno?",
  "Já contratou agência e sentiu que pagou caro por pouco?",
  "Sente que seus concorrentes estão sempre à frente?",
  "Tem leads entrando, mas ninguém faz follow-up?",
  "Sua empresa depende de indicação para vender?",
  "Posta nas redes sociais mas não gera venda?",
];

const antiPatterns = [
  { wrong: "Contratar agência sem estratégia", right: "Ter um plano antes de executar" },
  { wrong: "Investir em mídia sem funil", right: "Mídia direcionada para cada etapa" },
  { wrong: "Criar site bonito sem conversão", right: "LP com foco em captação de leads" },
  { wrong: "Ignorar o comercial", right: "Plano comercial estruturado" },
  { wrong: "Gerenciar leads no WhatsApp", right: "CRM organizado e funcional" },
];

const deliverables = [
  { icon: Target, title: "Planejamento Estratégico", desc: "Diagnóstico + posicionamento + plano de ação" },
  { icon: TrendingUp, title: "Plano Comercial", desc: "Funil, processo de vendas e abordagem" },
  { icon: Flame, title: "Plano de Mídia", desc: "Campanhas, públicos, verba e comunicação" },
  { icon: Zap, title: "Landing Page de Alta Conversão", desc: "Página pronta para captar leads — 1 ano de acesso" },
  { icon: Phone, title: "CRM Completo", desc: "Gestão de leads e pipeline — 1 ano de acesso" },
  { icon: CheckCircle2, title: "Passo a Passo", desc: "Implementação guiada para você executar" },
];

const testimonials = [
  { name: "Carlos M.", role: "CEO — Construtora", text: "Em 3 meses triplicamos os leads qualificados. A estrutura que a Escale montou mudou nosso jogo comercial.", stars: 5 },
  { name: "Fernanda R.", role: "Diretora — Clínica Estética", text: "Paramos de depender de indicação. Hoje temos um fluxo previsível de pacientes todo mês.", stars: 5 },
  { name: "Ricardo S.", role: "Sócio — Escritório de Advocacia", text: "O plano comercial sozinho já valeu o investimento. Organizamos tudo que estava solto.", stars: 5 },
];

export default function LP2() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const stat1 = useCountUp(15);
  const stat2 = useCountUp(200);
  const stat3 = useCountUp(97);

  const faqItems = [
    { q: "Serve para qualquer tipo de empresa?", a: "Sim, para qualquer empresa que quer vender mais com estrutura e estratégia." },
    { q: "A LP e o CRM já vêm prontos?", a: "Sim. A landing page e o CRM estão inclusos com 1 ano de acesso." },
    { q: "Posso parcelar?", a: "Sim, em até 12x sem juros de R$ 708,08." },
    { q: "Em quanto tempo vejo resultado?", a: "Com a implementação orientada, você pode começar a ver resultados nas primeiras semanas." },
  ];

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* ═══ URGENCY BAR ═══ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-bold tracking-wide animate-pulse">
        <Clock className="inline h-4 w-4 mr-2 -mt-0.5" />
        OFERTA POR TEMPO LIMITADO — Vagas restritas para este mês
      </div>

      {/* ═══ HERO — Direct, aggressive ═══ */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 via-black to-black" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-blue-400 font-bold text-sm tracking-[0.3em] uppercase mb-6">
              Para empresas que estão cansadas de improvisar
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Pare de <span className="text-red-500 line-through">jogar dinheiro fora</span> com marketing sem estratégia
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Receba um <strong className="text-white">pacote completo</strong> com planejamento estratégico, plano comercial, plano de mídia, landing page e CRM — tudo pronto para você <strong className="text-white">vender mais a partir de agora</strong>.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 shadow-lg shadow-green-500/30">
              <MessageCircle className="h-6 w-6" />
              QUERO PARAR DE PERDER VENDAS
            </a>
            <p className="text-gray-500 text-sm mt-4">Resposta em menos de 2 horas</p>
          </Reveal>
        </div>

        <Reveal delay={400}>
          <div className="max-w-3xl mx-auto px-6 mt-16 grid grid-cols-3 gap-4 text-center">
            <div className="border border-gray-800 rounded-2xl p-5 bg-gray-900/50">
              <span ref={stat1.ref} className="text-3xl md:text-4xl font-extrabold text-blue-400">{stat1.count}+</span>
              <p className="text-gray-400 text-sm mt-1">Anos de experiência</p>
            </div>
            <div className="border border-gray-800 rounded-2xl p-5 bg-gray-900/50">
              <span ref={stat2.ref} className="text-3xl md:text-4xl font-extrabold text-blue-400">{stat2.count}+</span>
              <p className="text-gray-400 text-sm mt-1">Empresas atendidas</p>
            </div>
            <div className="border border-gray-800 rounded-2xl p-5 bg-gray-900/50">
              <span ref={stat3.ref} className="text-3xl md:text-4xl font-extrabold text-blue-400">{stat3.count}%</span>
              <p className="text-gray-400 text-sm mt-1">Satisfação</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ PAIN IDENTIFICATION ═══ */}
      <section className="py-16 md:py-24 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-4">
              Se você se identifica com <span className="text-red-500">alguma dessas situações</span>, este pacote foi feito para você
            </h2>
            <p className="text-gray-400 text-center mb-12">Marque mentalmente quantas se aplicam ao seu negócio:</p>
          </Reveal>
          <div className="space-y-4">
            {painPoints.map((pain, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="flex items-center gap-4 bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-red-500/50 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <p className="text-base md:text-lg font-medium">{pain}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={500}>
            <p className="text-center mt-10 text-xl font-bold text-gray-300">
              Se marcou <span className="text-red-500">2 ou mais</span>, você está perdendo dinheiro todo dia.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ WRONG vs RIGHT ═══ */}
      <section className="py-16 md:py-24 bg-black">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-14">
              O que a maioria faz <span className="text-red-500">errado</span> vs. o que <span className="text-green-400">funciona</span>
            </h2>
          </Reveal>
          <div className="space-y-4">
            {antiPatterns.map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/30 rounded-xl p-4">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-300">{item.wrong}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-green-950/30 border border-green-900/30 rounded-xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{item.right}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BREAK ═══ */}
      <section className="py-14 bg-gradient-to-r from-blue-600 to-blue-800 text-center">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Chega de perder tempo e dinheiro.</h2>
          <p className="text-blue-100 mb-8 text-lg">Fale agora com a Escale e descubra como estruturar seu crescimento.</p>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-blue-700 font-bold text-lg px-10 py-5 rounded-full hover:bg-gray-100 transition-all hover:scale-105">
            <MessageCircle className="h-6 w-6" />
            QUERO FALAR COM A ESCALE
          </a>
        </Reveal>
      </section>

      {/* ═══ WHAT YOU GET ═══ */}
      <section className="py-16 md:py-24 bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <p className="text-blue-400 font-bold text-sm tracking-[0.3em] uppercase text-center mb-4">O que você recebe</p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-14">
              Tudo que sua empresa precisa em <span className="text-blue-400">um único pacote</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deliverables.map((d, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/40 transition-all group">
                  <div className="h-12 w-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                    <d.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{d.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{d.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 md:py-24 bg-black">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-14">
              Quem já contratou, <span className="text-blue-400">recomenda</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICE / OFFER ═══ */}
      <section className="py-16 md:py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-blue-400 font-bold text-sm tracking-[0.3em] uppercase mb-4">Investimento</p>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-8">
              Tudo isso por um investimento acessível
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="bg-gray-900 border-2 border-blue-500 rounded-3xl p-8 md:p-12 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-6 py-2 rounded-full tracking-wider uppercase">
                Oferta especial
              </div>
              <p className="text-gray-400 text-sm mb-2">Super Pacote Escale</p>
              <p className="text-4xl md:text-6xl font-extrabold text-white mb-2">
                12x de <span className="text-blue-400">R$ 708,08</span>
              </p>
              <p className="text-gray-400 mb-8">sem juros  ou R$ 8.497 à vista</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 text-left">
                {["Planejamento Estratégico", "Plano Comercial", "Plano de Mídia", "Landing Page (1 ano)", "CRM (1 ano)", "Passo a Passo"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 shadow-lg shadow-green-500/30 w-full justify-center">
                <MessageCircle className="h-6 w-6" />
                QUERO CONTRATAR AGORA
              </a>
              <p className="text-gray-600 text-xs mt-4">Pagamento seguro · Parcelamento no cartão</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 md:py-20 bg-black">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">Perguntas frequentes</h2>
          </Reveal>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full p-5 text-left font-semibold hover:bg-gray-900/50 transition-colors">
                    {item.q}
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{item.a}</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-950 to-black text-center">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-6">
              Sua empresa vai continuar <span className="text-red-500">improvisando</span> ou vai começar a <span className="text-blue-400">crescer com estrutura</span>?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">A decisão é sua. O plano é nosso.</p>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-bold text-xl px-12 py-6 rounded-full transition-all hover:scale-105 shadow-lg shadow-green-500/30">
              <MessageCircle className="h-7 w-7" />
              FALAR COM A ESCALE AGORA
              <ArrowRight className="h-6 w-6" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-black/90 backdrop-blur-sm border-t border-gray-800 md:hidden">
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-black font-bold py-4 rounded-full w-full text-base">
          <MessageCircle className="h-5 w-5" />
          QUERO CONTRATAR AGORA
        </a>
      </div>

      {/* Footer minimal */}
      <footer className="py-8 bg-black border-t border-gray-900 text-center">
        <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Escale · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
