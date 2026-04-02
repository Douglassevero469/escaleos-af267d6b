import { useState, useEffect, FormEvent, useMemo } from "react";
import { CheckCircle2, MessageCircle, Zap, Target, TrendingUp, BarChart3, DollarSign, User, Mail, Phone, Clock, AlertTriangle, Users, CalendarClock, ShieldCheck, Briefcase } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import escaleLogoWhite from "@/assets/escale-logo-white.png";

const WA_LINK = "https://wa.me/5500000000000?text=Quero%20saber%20mais%20sobre%20o%20Super%20Pacote%20Escale";

/* ─── Questions data (BANT: Budget, Authority, Need, Timeline + qualificação) ─── */
const questions = [
  // NEED — Necessidade
  {
    icon: Target,
    category: "need",
    question: "Qual o maior desafio da sua empresa hoje?",
    options: ["Gerar leads qualificados", "Converter vendas", "Organizar processos comerciais", "Comunicar melhor a marca"],
  },
  {
    icon: BarChart3,
    category: "need",
    question: "Sua empresa tem um plano comercial estruturado?",
    options: ["Sim, completo e atualizado", "Tenho algo básico", "Não tenho nenhum"],
  },
  {
    icon: TrendingUp,
    category: "need",
    question: "Você já investiu em tráfego pago?",
    options: ["Sim, com bons resultados", "Sim, mas sem retorno claro", "Nunca investi"],
  },
  {
    icon: Zap,
    category: "need",
    question: "Sua empresa usa um CRM para gerenciar oportunidades?",
    options: ["Sim, uso diariamente", "Já tentei mas não funcionou", "Não uso nenhum", "Nem sei o que é"],
  },
  // AUTHORITY — Autoridade
  {
    icon: ShieldCheck,
    category: "authority",
    question: "Qual é o seu papel na empresa?",
    options: ["Sócio / CEO", "Diretor / Gerente", "Coordenador / Analista", "Consultor / Freelancer"],
  },
  {
    icon: Users,
    category: "authority",
    question: "Quantas pessoas atuam na área comercial/marketing?",
    options: ["Só eu", "2 a 5 pessoas", "6 a 15 pessoas", "Mais de 15"],
  },
  // BUDGET — Orçamento
  {
    icon: DollarSign,
    category: "budget",
    question: "Qual o faturamento mensal da sua empresa?",
    options: [
      "R$ 20k – R$ 50k",
      "R$ 50k – R$ 100k",
      "R$ 100k – R$ 200k",
      "R$ 200k – R$ 500k",
      "R$ 500k – R$ 1M",
      "Acima de R$ 1M",
    ],
  },
  {
    icon: Briefcase,
    category: "budget",
    question: "Quanto você investiria para estruturar estratégia + comercial + mídia + CRM?",
    options: ["Até R$ 5 mil", "R$ 5 mil – R$ 10 mil", "R$ 10 mil – R$ 20 mil", "Acima de R$ 20 mil"],
  },
  // TIMELINE — Urgência
  {
    icon: CalendarClock,
    category: "timeline",
    question: "Quando você precisa ter isso implementado?",
    options: ["Imediatamente, é urgente", "Nos próximos 30 dias", "Em 2 a 3 meses", "Sem prazo definido"],
  },
];

const encouragements = [
  "Ótima escolha! 🎯",
  "Perfeito! 🚀",
  "Excelente! 💡",
  "Entendi! 🔍",
  "Boa! 👊",
  "Importante saber! 📊",
  "Show! ⚡",
  "Quase lá! 🔥",
  "Último passo! 🏆",
];

/* ─── Social proof ─── */
const socialProofData = [
  { name: "Marcelo R.", city: "São Paulo, SP", time: "agora mesmo" },
  { name: "Camila S.", city: "Belo Horizonte, MG", time: "há 2 min" },
  { name: "André L.", city: "Curitiba, PR", time: "há 3 min" },
  { name: "Tatiane F.", city: "Rio de Janeiro, RJ", time: "há 5 min" },
  { name: "Bruno M.", city: "Florianópolis, SC", time: "há 7 min" },
  { name: "Felipe G.", city: "Campinas, SP", time: "há 10 min" },
  { name: "Renata C.", city: "Salvador, BA", time: "há 12 min" },
  { name: "Diego A.", city: "Porto Alegre, RS", time: "há 14 min" },
];

function SocialProofToast() {
  const [current, setCurrent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let idx = 0;
    const show = () => {
      setCurrent(idx);
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
      idx = (idx + 1) % socialProofData.length;
    };
    const timer = setInterval(show, 5000);
    const initialTimer = setTimeout(show, 4000);
    return () => { clearInterval(timer); clearTimeout(initialTimer); };
  }, []);

  if (current === null) return null;
  const item = socialProofData[current];

  return (
    <div className={`fixed bottom-6 left-4 z-[60] max-w-xs transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <div className="bg-white text-black rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-gray-200">
        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{item.name}</p>
          <p className="text-xs text-gray-600">Contratou o Super Pacote</p>
          <p className="text-[10px] text-gray-400">{item.city} · {item.time}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Countdown timer hook ─── */
function useCountdown() {
  const target = useMemo(() => {
    // Set deadline to end of current day + 2 days (rolling urgency)
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(23, 59, 59, 0);
    return d.getTime();
  }, []);

  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = target - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = target - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

function CountdownBanner() {
  const { hours, minutes, seconds } = useCountdown();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-gradient-to-r from-red-600/20 to-orange-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 animate-[fade-in_0.5s_ease-out]">
      <div className="flex items-center justify-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <span className="text-sm font-bold text-red-400">OFERTA EXPIRA EM:</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {[
          { value: pad(hours), label: "horas" },
          { value: pad(minutes), label: "min" },
          { value: pad(seconds), label: "seg" },
        ].map((t) => (
          <div key={t.label} className="flex flex-col items-center">
            <div className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 min-w-[52px] text-center">
              <span className="text-2xl font-bold tabular-nums">{t.value}</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1">{t.label}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-white/40 mt-3">
        <Clock className="inline h-3 w-3 mr-1" />
        Apenas <span className="text-red-400 font-bold">3 vagas</span> restantes com condição especial
      </p>
    </div>
  );
}

/* ─── Main component ─── */
export default function LP3() {
  const [step, setStep] = useState(0); // 0=welcome, 1-6=questions, 7=capture, 8=loading, 9=result
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");

  const totalQuestions = questions.length;
  const progressValue = step === 0 ? 0 : step > totalQuestions ? 100 : Math.round((step / totalQuestions) * 100);

  const handleAnswer = (option: string) => {
    if (transitioning) return;
    setSelectedOption(option);
    setShowEncouragement(true);

    setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        setAnswers((prev) => [...prev, option]);
        setStep((prev) => prev + 1);
        setSelectedOption(null);
        setShowEncouragement(false);
        setTransitioning(false);
      }, 400);
    }, 500);
  };

  // Handle lead capture submit
  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim()) return;
    setStep(totalQuestions + 2); // go to loading

    // Fire and forget - send lead to backend
    try {
      await supabase.functions.invoke("capture-quiz-lead", {
        body: {
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          answers,
        },
      });
    } catch {
      // silently fail - don't block the user experience
    }
  };

  // Loading animation
  useEffect(() => {
    if (step !== totalQuestions + 2) return;
    setLoadingPercent(0);
    const interval = setInterval(() => {
      setLoadingPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(totalQuestions + 3), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [step, totalQuestions]);

  // BANT Diagnosis logic
  const getDiagnosis = () => {
    // Scores per BANT dimension (0-10 each)
    let need = 0, authority = 0, budget = 0, timeline = 0;

    // Q0: Desafio (all options indicate need)
    need += 2;

    // Q1: Plano comercial
    if (answers[1] === "Sim, completo e atualizado") need += 0;
    else if (answers[1] === "Tenho algo básico") need += 2;
    else need += 4;

    // Q2: Tráfego pago
    if (answers[2] === "Sim, com bons resultados") need += 0;
    else if (answers[2] === "Sim, mas sem retorno claro") need += 2;
    else need += 3;

    // Q3: CRM
    if (answers[3] === "Sim, uso diariamente") need += 0;
    else if (answers[3] === "Já tentei mas não funcionou") need += 2;
    else if (answers[3] === "Não uso nenhum") need += 3;
    else need += 4; // nem sabe

    // Q4: Papel na empresa (Authority)
    if (answers[4] === "Sócio / CEO") authority = 10;
    else if (answers[4] === "Diretor / Gerente") authority = 8;
    else if (answers[4] === "Coordenador / Analista") authority = 5;
    else authority = 3;

    // Q5: Tamanho da equipe
    if (answers[5] === "Só eu") authority = Math.min(authority, 6);
    else if (answers[5] === "Mais de 15") authority = Math.max(authority, 8);

    // Q6: Faturamento (Budget indicator)
    const fatIdx = ["R$ 20k – R$ 50k", "R$ 50k – R$ 100k", "R$ 100k – R$ 200k", "R$ 200k – R$ 500k", "R$ 500k – R$ 1M", "Acima de R$ 1M"].indexOf(answers[6] || "");
    budget = Math.min(10, (fatIdx + 1) * 2);

    // Q7: Investimento disponível
    if (answers[7] === "Acima de R$ 20 mil") budget = Math.max(budget, 10);
    else if (answers[7] === "R$ 10 mil – R$ 20 mil") budget = Math.max(budget, 8);
    else if (answers[7] === "R$ 5 mil – R$ 10 mil") budget = Math.max(budget, 6);
    else budget = Math.max(budget, 3);

    // Q8: Timeline
    if (answers[8] === "Imediatamente, é urgente") timeline = 10;
    else if (answers[8] === "Nos próximos 30 dias") timeline = 8;
    else if (answers[8] === "Em 2 a 3 meses") timeline = 5;
    else timeline = 2;

    // Cap need at 10
    need = Math.min(need, 10);

    const totalScore = Math.round((need + authority + budget + timeline) / 4);

    // Build weaknesses for personalized recommendations
    const weaknesses: string[] = [];
    if (need >= 7) weaknesses.push("estrutura comercial e processos");
    if (answers[2] !== "Sim, com bons resultados") weaknesses.push("estratégia de mídia paga");
    if (answers[3] !== "Sim, uso diariamente") weaknesses.push("gestão de relacionamento (CRM)");
    if (answers[1] !== "Sim, completo e atualizado") weaknesses.push("planejamento comercial");

    // Personalized headline based on main challenge
    const mainChallenge = answers[0] || "";
    let challengeText = "";
    if (mainChallenge.includes("leads")) challengeText = "Sua máquina de geração de leads precisa de estrutura.";
    else if (mainChallenge.includes("vendas")) challengeText = "Suas vendas estão travadas por falta de processo.";
    else if (mainChallenge.includes("processos")) challengeText = "Seus processos comerciais precisam de organização urgente.";
    else challengeText = "Sua comunicação precisa de estratégia para gerar resultados.";

    if (totalScore >= 8) {
      return {
        level: "Crítico",
        color: "text-red-400",
        bg: "from-red-500/20 to-red-600/10",
        pct: Math.min(30, totalScore * 3),
        headline: `🚨 ${challengeText}`,
        sub: `Identificamos gaps críticos em: ${weaknesses.slice(0, 3).join(", ")}. Cada dia sem agir é faturamento perdido.`,
        urgency: "alta",
        recommendations: ["Planejamento Estratégico completo", "Plano Comercial com funil definido", "CRM para não perder nenhum lead", "Landing Page de alta conversão"],
      };
    }
    if (totalScore >= 5) {
      return {
        level: "Atenção",
        color: "text-yellow-400",
        bg: "from-yellow-500/20 to-yellow-600/10",
        pct: 45 + (10 - totalScore) * 3,
        headline: `⚠️ ${challengeText}`,
        sub: `Pontos de melhoria: ${weaknesses.slice(0, 2).join(" e ")}. Você tem potencial, mas opera abaixo da capacidade.`,
        urgency: "média",
        recommendations: ["Plano de Mídia otimizado", "CRM para gestão de pipeline", "Implementação orientada passo a passo"],
      };
    }
    return {
      level: "Otimização",
      color: "text-green-400",
      bg: "from-green-500/20 to-green-600/10",
      pct: 72 + (5 - totalScore) * 3,
      headline: `✅ Você já tem uma base sólida. Hora de escalar.`,
      sub: `Com ajustes em ${weaknesses.length > 0 ? weaknesses[0] : "integração das ferramentas"}, seu crescimento pode acelerar significativamente.`,
      urgency: "baixa",
      recommendations: ["Integração completa das ferramentas", "Otimização do funil de vendas", "Escala com tráfego pago"],
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-['Montserrat',sans-serif] flex flex-col">
      {/* Progress bar */}
      {step > 0 && step <= totalQuestions + 3 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <img src={escaleLogoWhite} alt="Escale" className="h-6" />
            <div className="flex-1">
              <Progress value={progressValue} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-green-400 [&>div]:transition-all [&>div]:duration-700" />
            </div>
            <span className="text-xs font-bold text-blue-400 min-w-[36px] text-right">{progressValue}%</span>
          </div>
          {step >= 1 && step <= totalQuestions && (
            <p className="text-center text-[11px] text-white/40 mt-1">Pergunta {step} de {totalQuestions}</p>
          )}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        {/* ─── WELCOME ─── */}
        {step === 0 && (
          <div className={`max-w-lg mx-auto text-center transition-all duration-500 ${transitioning ? "opacity-0 -translate-y-6" : "opacity-100 translate-y-0"}`}>
            <img src={escaleLogoWhite} alt="Escale" className="h-10 mx-auto mb-8" />
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-xs font-semibold mb-6">
              <Zap className="h-3.5 w-3.5" /> DIAGNÓSTICO GRATUITO
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              Descubra em <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">60 segundos</span> o que está travando o crescimento da sua empresa
            </h1>
            <p className="text-white/60 text-lg mb-8">
              Responda 6 perguntas rápidas e receba um diagnóstico personalizado com a solução ideal para escalar seus resultados.
            </p>
            <button
              onClick={() => { setTransitioning(true); setTimeout(() => { setStep(1); setTransitioning(false); }, 400); }}
              className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg px-10 py-4 rounded-xl transition-all duration-300 animate-[pulse_2s_ease-in-out_infinite] hover:animate-none hover:scale-105 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            >
              Começar Diagnóstico
              <span className="ml-2">→</span>
            </button>
            <p className="text-white/30 text-xs mt-4">🔒 Suas respostas são 100% confidenciais</p>
          </div>
        )}

        {/* ─── QUESTIONS ─── */}
        {step >= 1 && step <= totalQuestions && (
          <div className={`max-w-lg mx-auto w-full transition-all duration-400 ${transitioning ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}`}>
            {showEncouragement && (
              <div className="text-center mb-4 animate-[fade-in_0.3s_ease-out]">
                <span className="text-lg">{encouragements[step - 1]}</span>
              </div>
            )}

            {(() => {
              const q = questions[step - 1];
              const Icon = q.icon;
              return (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold">{q.question}</h2>
                  </div>

                  <div className={`grid gap-3 ${q.options.length > 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {q.options.map((option) => {
                      const isSelected = selectedOption === option;
                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          disabled={!!selectedOption}
                          className={`group relative text-left px-5 py-4 rounded-xl border transition-all duration-300 ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/20 scale-[0.98]"
                              : "border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10 hover:scale-[1.02]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-sm md:text-base">{option}</span>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-blue-400 animate-[scale-in_0.2s_ease-out]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── LEAD CAPTURE ─── */}
        {step === totalQuestions + 1 && (
          <div className="max-w-md mx-auto w-full animate-[fade-in_0.5s_ease-out]">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-xs font-semibold mb-4">
                <CheckCircle2 className="h-3.5 w-3.5" /> QUIZ COMPLETO!
              </div>
              <h2 className="text-2xl font-bold mb-2">Seu diagnóstico está pronto! 🎉</h2>
              <p className="text-white/50 text-sm">Preencha seus dados para receber o resultado personalizado:</p>
            </div>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="tel"
                  placeholder="WhatsApp (opcional)"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 animate-[pulse_2s_ease-in-out_infinite] hover:animate-none hover:scale-105 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
              >
                Ver meu diagnóstico →
              </button>
            </form>
            <p className="text-center text-white/30 text-xs mt-4">🔒 Seus dados estão seguros e não serão compartilhados</p>
          </div>
        )}

        {/* ─── LOADING ─── */}
        {step === totalQuestions + 2 && (
          <div className="max-w-md mx-auto text-center">
            <div className="relative h-32 w-32 mx-auto mb-8">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none" stroke="url(#grad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 108}`}
                  strokeDashoffset={`${Math.PI * 108 * (1 - loadingPercent / 100)}`}
                  className="transition-all duration-100"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-400">{loadingPercent}%</span>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Analisando suas respostas...</h2>
            <p className="text-white/50 text-sm">Gerando diagnóstico personalizado</p>
          </div>
        )}

        {/* ─── RESULT ─── */}
        {step === totalQuestions + 3 && (() => {
          const d = getDiagnosis();
          return (
            <div className="max-w-lg mx-auto w-full animate-[fade-in_0.6s_ease-out]">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 bg-gradient-to-r ${d.bg} ${d.color} border border-current/20`}>
                  Nível: {d.level} · Urgência {d.urgency}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-3">{d.headline}</h1>
                <p className="text-white/60">{d.sub}</p>
              </div>

              {/* Score visual */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white/70">Maturidade Comercial</span>
                  <span className={`text-sm font-bold ${d.color}`}>{d.pct}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${d.pct}%` }} />
                </div>
              </div>

              {/* Personalized recommendations */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-sm text-white/70 mb-3">📋 Recomendações para o seu cenário:</h3>
                <div className="space-y-2">
                  {d.recommendations.map((rec) => (
                    <div key={rec} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <span className="text-white/80">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution */}
              <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-lg mb-4 text-center">A solução: Super Pacote Escale</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {["Planejamento Estratégico", "Plano Comercial", "Plano de Mídia", "Landing Page de Alta Conversão", "CRM por 1 ano", "Implementação Orientada"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-white/50 text-sm">Investimento</p>
                  <p className="text-3xl font-bold mt-1">
                    12x de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">R$ 833</span>
                  </p>
                  <p className="text-white/40 text-xs mt-1">ou R$ 8.497 à vista</p>
                </div>
              </div>

              {/* Urgency countdown */}
              <CountdownBanner />

              {/* CTA */}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 animate-[pulse_2s_ease-in-out_infinite] hover:animate-none hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              >
                <MessageCircle className="h-5 w-5" />
                Quero contratar agora
              </a>
              <p className="text-center text-white/30 text-xs mt-3">⚡ Restam apenas <span className="text-red-400 font-bold">3 vagas</span> este mês</p>
            </div>
          );
        })()}
      </div>

      {/* Social proof - only on result */}
      {step === totalQuestions + 3 && <SocialProofToast />}
    </div>
  );
}
