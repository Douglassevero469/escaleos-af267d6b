import { useState, useEffect, FormEvent } from "react";
import { CheckCircle2, MessageCircle, Zap, Target, TrendingUp, BarChart3, DollarSign, User, Mail, Phone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import escaleLogoWhite from "@/assets/escale-logo-white.png";

const WA_LINK = "https://wa.me/5500000000000?text=Quero%20saber%20mais%20sobre%20o%20Super%20Pacote%20Escale";

/* ─── Questions data ─── */
const questions = [
  {
    icon: Target,
    question: "Qual o maior desafio da sua empresa hoje?",
    options: ["Gerar leads qualificados", "Converter vendas", "Organizar processos", "Comunicar melhor"],
  },
  {
    icon: BarChart3,
    question: "Sua empresa tem um plano comercial estruturado?",
    options: ["Sim, completo", "Mais ou menos", "Não tenho"],
  },
  {
    icon: TrendingUp,
    question: "Você já investiu em tráfego pago?",
    options: ["Sim, com resultados", "Sim, sem resultados", "Nunca investi"],
  },
  {
    icon: Zap,
    question: "Sua empresa tem um CRM?",
    options: ["Sim, uso diariamente", "Não", "Nem sei o que é"],
  },
  {
    icon: DollarSign,
    question: "Qual o faturamento mensal da sua empresa?",
    options: [
      "R$ 20k – R$ 40k",
      "R$ 40k – R$ 60k",
      "R$ 60k – R$ 80k",
      "R$ 80k – R$ 100k",
      "R$ 100k – R$ 150k",
      "R$ 150k – R$ 200k",
      "R$ 200k – R$ 300k",
      "R$ 300k – R$ 500k",
      "R$ 500k – R$ 1M",
      "Acima de R$ 1M",
    ],
  },
  {
    icon: DollarSign,
    question: "Quanto você investiria para estruturar tudo isso?",
    options: ["Até R$ 5 mil", "R$ 5 mil – R$ 10 mil", "Acima de R$ 10 mil"],
  },
];

const encouragements = ["Ótima escolha! 🎯", "Perfeito! 🚀", "Excelente! 💡", "Quase lá! 🔥", "Show! ⚡", "Último passo! 🏆"];

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

/* ─── Main component ─── */
export default function LP3() {
  const [step, setStep] = useState(0); // 0=welcome, 1-6=questions, 7=loading, 8=result
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);

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

  // Loading animation
  useEffect(() => {
    if (step !== totalQuestions + 1) return;
    setLoadingPercent(0);
    const interval = setInterval(() => {
      setLoadingPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(totalQuestions + 2), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [step, totalQuestions]);

  // Diagnosis logic
  const getDiagnosis = () => {
    let score = 0;
    // Q1: all challenges = needs structure
    // Q2: plan
    if (answers[1] === "Sim, completo") score += 2;
    else if (answers[1] === "Mais ou menos") score += 1;
    // Q3: traffic
    if (answers[2] === "Sim, com resultados") score += 2;
    else if (answers[2] === "Sim, sem resultados") score += 1;
    // Q4: CRM
    if (answers[3] === "Sim, uso diariamente") score += 2;

    if (score <= 2) return { level: "Crítico", color: "text-red-400", bg: "from-red-500/20 to-red-600/10", pct: 25, headline: "Sua empresa precisa urgentemente de estrutura comercial", sub: "Você está perdendo vendas todos os dias por falta de processo." };
    if (score <= 4) return { level: "Atenção", color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/10", pct: 55, headline: "Sua empresa tem potencial, mas opera no improviso", sub: "Com a estrutura certa, seu faturamento pode dobrar em meses." };
    return { level: "Bom", color: "text-green-400", bg: "from-green-500/20 to-green-600/10", pct: 78, headline: "Você já tem base, agora precisa escalar com método", sub: "O Super Pacote vai integrar tudo e acelerar seus resultados." };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-['Montserrat',sans-serif] flex flex-col">
      {/* Progress bar */}
      {step > 0 && step <= totalQuestions + 2 && (
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

        {/* ─── LOADING ─── */}
        {step === totalQuestions + 1 && (
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
        {step === totalQuestions + 2 && (() => {
          const d = getDiagnosis();
          return (
            <div className="max-w-lg mx-auto w-full animate-[fade-in_0.6s_ease-out]">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 bg-gradient-to-r ${d.bg} ${d.color} border border-current/20`}>
                  Nível: {d.level}
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
              <p className="text-center text-white/30 text-xs mt-3">⚡ Vagas limitadas este mês</p>
            </div>
          );
        })()}
      </div>

      {/* Social proof - only on result */}
      {step === totalQuestions + 2 && <SocialProofToast />}
    </div>
  );
}
