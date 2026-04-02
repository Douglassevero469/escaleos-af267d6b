import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, CheckCircle, XCircle, ArrowRight,
  FileText, Target, BarChart3, Layout, Users, ListChecks,
  PhoneCall, ChevronDown, Sparkles, Shield, Clock, Zap,
  MessageCircle
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
import escaleIcon from "@/assets/escale-icon.png";
import { useEffect, useState } from "react";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Quero%20saber%20mais%20sobre%20o%20Super%20Pacote%20Escale";
const CTA_LINK = WHATSAPP_LINK;

function StickyTopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60]">
      <div className="bg-primary/95 backdrop-blur-md text-primary-foreground py-2 px-4 text-center text-sm font-medium">
        Estratégia + Comercial + Mídia + Landing Page + CRM em uma única solução
      </div>
    </div>
  );
}

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

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${className}`}>{children}</h2>;
}

function PainPoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <span className="text-muted-foreground text-sm md:text-base">{children}</span>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <span className="text-sm md:text-base">{children}</span>
    </div>
  );
}

function PackageBlock({ icon: Icon, title, desc, items }: { icon: React.ElementType; title: string; desc: string; items: string[] }) {
  return (
    <GlassCard className="h-full">
      <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{desc}</p>
      <div className="space-y-1">
        {items.map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
      </div>
    </GlassCard>
  );
}

const miniSeals = [
  { icon: Shield, label: "Estrutura completa" },
  { icon: Zap, label: "Alta conversão" },
  { icon: Users, label: "1 ano de CRM" },
  { icon: Layout, label: "1 ano de LP" },
  { icon: ListChecks, label: "Implementação orientada" },
];

const faqItems = [
  { q: "O que exatamente eu recebo ao contratar?", a: "Você recebe um pacote completo com planejamento estratégico, plano comercial, plano de mídia, landing page de alta conversão, CRM e passo a passo de implementação." },
  { q: "Por quanto tempo terei acesso à landing page e ao CRM?", a: "Você terá 1 ano de acesso à landing page e 1 ano de acesso ao CRM, conforme a oferta apresentada." },
  { q: "Isso serve para qualquer tipo de empresa?", a: "A solução é ideal para empresas que querem estruturar marketing e comercial com mais clareza, processo e intenção de crescimento." },
  { q: "A landing page já vem pronta?", a: "Sim, a proposta inclui a landing page dentro do pacote, pensada com foco em alta conversão." },
  { q: "O CRM está incluso no valor?", a: "Sim. O acesso ao CRM por 1 ano já está incluso no pacote." },
  { q: "Esse pacote é só estratégico ou também orienta a execução?", a: "Além da estrutura estratégica, você recebe o passo a passo de implementação para saber como aplicar a solução." },
  { q: "Qual é o valor?", a: "O investimento é de R$ 9.997, podendo ser parcelado em 12x sem juros de R$ 833,08." },
];

const objections = [
  { q: "Hoje eu ainda faço muita coisa no improviso.", a: "Justamente por isso essa solução faz sentido. Ela foi desenhada para ajudar sua empresa a sair da operação desorganizada e ganhar estrutura." },
  { q: "Será que eu preciso de tudo isso?", a: "Se o seu objetivo é crescer com mais previsibilidade, não faz sentido olhar só uma parte. Marketing, comercial, conversão e gestão precisam conversar entre si." },
  { q: "Eu já investi antes e não tive resultado.", a: "Muitas vezes o problema não foi investir. Foi investir em ações desconectadas. Aqui, a proposta é integrar estratégia, captação, conversão e organização comercial." },
  { q: "Parece muito para implementar.", a: "Por isso a entrega inclui o passo a passo. A ideia não é te deixar perdido, mas te dar direção clara sobre como colocar a estrutura para funcionar." },
  { q: "Posso contratar isso depois.", a: "Pode. Mas adiar organização custa caro. Cada mês sem estrutura representa oportunidades perdidas, retrabalho e crescimento abaixo do potencial." },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      <StickyTopBar />
      <StickyBottomCTA />


      {/* ===== 1. HERO ===== */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="mb-10">
            <img src={escaleLogoDark} alt="Escale" className="h-10 mx-auto" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[0.95]">
            Sua empresa não precisa de mais uma agência.{" "}
            <span className="gradient-text">Precisa de estrutura para crescer.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8 font-light leading-relaxed">
            A Escale entrega um pacote completo com planejamento estratégico, plano comercial, plano de mídia, landing page de alta conversão e CRM — tudo com passo a passo de implementação para sua empresa sair do improviso e entrar em um modelo de crescimento real.
          </p>

          <GlassCard glow className="inline-block mb-8 py-4 px-8">
            <p className="text-muted-foreground text-sm mb-1">Investimento</p>
            <p className="font-display text-3xl md:text-4xl font-bold gradient-text">12x de R$ 833,08</p>
            <p className="text-muted-foreground text-sm">sem juros · ou R$ 9.997 à vista</p>
          </GlassCard>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="btn-primary-glow gap-2 text-base h-13 px-8 font-semibold">
                Quero estruturar meu negócio <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="text-base h-13 px-8 border-border/60 hover:bg-secondary gap-2">
                <PhoneCall className="h-4 w-4" /> Falar com um especialista
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground">Sem achismo. Sem gambiarra. Sem depender de tentativa e erro para crescer.</p>

          {/* Mini seals */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {miniSeals.map((s, i) => (
              <div key={i} className="glass rounded-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <s.icon className="h-3.5 w-3.5 text-primary" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 2. PROBLEMA ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>
            Se hoje sua empresa vende no improviso, o problema não é falta de esforço.{" "}
            <span className="gradient-text">É falta de estrutura.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-8">
            Muitas empresas até têm um bom produto ou serviço, mas travam porque não existe um sistema comercial e de marketing realmente organizado por trás.
          </p>
          <p className="text-muted-foreground mb-6">No dia a dia, isso aparece de várias formas:</p>
          <GlassCard>
            <div className="space-y-1">
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
          </GlassCard>
          <p className="text-muted-foreground mt-8 italic">
            O resultado é sempre parecido: você trabalha muito, investe em marketing, mas sente que a operação comercial não anda no ritmo que deveria.
          </p>
        </div>
      </section>

      {/* ===== 3. AGITAÇÃO ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>
            Crescer sem estratégia <span className="gradient-text">custa caro.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-8">
            Quando a empresa não tem clareza de posicionamento, processo comercial, estrutura de mídia e operação organizada, o prejuízo não vem só em dinheiro investido errado.
          </p>
          <p className="text-muted-foreground mb-6">Ele vem em:</p>
          <GlassCard>
            <div className="space-y-1">
              {[
                "oportunidades perdidas",
                "equipe desalinhada",
                "leads desperdiçados",
                "campanhas sem retorno",
                "baixa previsibilidade comercial",
                "retrabalho constante",
                "sensação de que tudo depende de você",
              ].map((item, i) => <PainPoint key={i}>{item}</PainPoint>)}
            </div>
          </GlassCard>
          <GlassCard glow className="mt-10 text-center py-8">
            <p className="font-display text-xl md:text-2xl font-bold">
              Sem estrutura, cada ação parece urgente.<br />
              <span className="gradient-text">Com estrutura, cada ação passa a ter função, meta e direção.</span>
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ===== 4. SOLUÇÃO ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <SectionTitle>
            Foi para resolver isso que criamos o{" "}
            <span className="gradient-text">Super Pacote da Escale.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            A Escale reúne em uma única entrega tudo o que uma empresa precisa para sair da desorganização e construir uma operação comercial e de marketing mais inteligente, previsível e escalável.
          </p>
          <p className="text-muted-foreground mb-10">
            Você não compra peças separadas. Você recebe uma <strong className="text-foreground">estrutura integrada</strong>, com lógica, estratégia e execução orientada.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            {[
              "Planejamento estratégico",
              "Plano comercial",
              "Plano de mídia",
              "Landing page de alta conversão",
              "CRM com acesso por 1 ano",
              "Acesso por 1 ano à landing page",
              "Passo a passo para implementação",
            ].map((item, i) => (
              <GlassCard key={i} className="flex items-center gap-3 py-3 px-4">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{item}</span>
              </GlassCard>
            ))}
          </div>
          <p className="text-muted-foreground mt-10 italic">
            Não é só uma entrega bonita. É uma <strong className="text-foreground">arquitetura de crescimento</strong> para sua empresa.
          </p>
        </div>
      </section>

      {/* ===== 5. O QUE ESTÁ INCLUSO ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <SectionTitle className="text-center">
            O que está incluso no <span className="gradient-text">pacote da Escale</span>
          </SectionTitle>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <PackageBlock
              icon={Target}
              title="Planejamento Estratégico"
              desc="Definimos a direção do seu negócio com mais clareza, posicionamento, metas, prioridades e estrutura de crescimento."
              items={["Diagnóstico macro da operação", "Clareza de posicionamento", "Definição de prioridades", "Estrutura de metas e direcionamento", "Visão estratégica para tomada de decisão"]}
            />
            <PackageBlock
              icon={BarChart3}
              title="Plano Comercial"
              desc="Organizamos sua frente de vendas para transformar interesse em processo, e processo em fechamento."
              items={["Definição de fluxo comercial", "Organização das etapas do funil", "Critérios de abordagem", "Orientação de processo de atendimento", "Estrutura para acompanhar oportunidades"]}
            />
            <PackageBlock
              icon={Sparkles}
              title="Plano de Mídia"
              desc="Criamos um direcionamento para investir em mídia com mais inteligência, coerência e intenção estratégica."
              items={["Definição de campanhas", "Estrutura de objetivos por etapa", "Direcionamento de públicos", "Distribuição de verba", "Comunicação por fase do funil"]}
            />
            <PackageBlock
              icon={Layout}
              title="Landing Page de Alta Conversão"
              desc="Desenvolvemos uma página pensada para transformar tráfego em lead e lead em oportunidade real."
              items={["Estrutura persuasiva", "Copy focada em conversão", "Página com foco em captação", "Clareza e performance", "1 ano de acesso à landing page"]}
            />
            <PackageBlock
              icon={Users}
              title="CRM com 1 ano de acesso"
              desc="Organize leads, negociações, acompanhamento comercial e relacionamento com mais controle."
              items={["Estrutura de CRM para gestão comercial", "Acompanhamento das oportunidades", "Organização do pipeline", "Visão clara sobre andamento dos leads", "1 ano de acesso incluso"]}
            />
            <PackageBlock
              icon={ListChecks}
              title="Passo a passo de implementação"
              desc="Além de entregar a estrutura, mostramos o caminho para colocar tudo em prática."
              items={["Orientação prática", "Visão de implementação", "Direcionamento para execução", "Clareza sobre o que fazer e em que ordem"]}
            />
          </div>
        </div>
      </section>

      {/* ===== 6. DIFERENCIAÇÃO ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>
            A maioria vende serviço.{" "}
            <span className="gradient-text">A Escale entrega estrutura.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-8">
            O que torna essa oferta diferente é que ela não foi pensada para resolver um problema isolado. Ela foi pensada para resolver o cenário completo de empresas que precisam:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "se posicionar melhor",
              "vender com mais processo",
              "atrair com mais inteligência",
              "converter com mais eficiência",
              "organizar a operação comercial",
              "crescer com mais previsibilidade",
            ].map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
          </div>
          <GlassCard glow className="mt-10 text-center py-6">
            <p className="font-display text-lg md:text-xl font-bold">
              Em vez de contratar várias soluções separadas, você recebe um{" "}
              <span className="gradient-text">pacote integrado</span>, com começo, meio e direção.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ===== 7. PARA QUEM É ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>
            Esse pacote é para empresas que querem{" "}
            <span className="gradient-text">parar de improvisar.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-8">
            A solução da Escale faz sentido para negócios que já entenderam: não basta aparecer, é preciso estruturar a operação para transformar atenção em venda.
          </p>
          <GlassCard>
            <div className="space-y-1">
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
          </GlassCard>
        </div>
      </section>

      {/* ===== 8. PARA QUEM NÃO É ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>Para quem <span className="text-destructive">não</span> é</SectionTitle>
          <GlassCard>
            <div className="space-y-1">
              {[
                "procura apenas um serviço pontual e barato",
                "quer resultado sem implementar nada",
                "não vê valor em estratégia",
                "prefere continuar no improviso",
                "busca só \"mais posts\" ou \"mais tráfego\" sem estrutura por trás",
              ].map((item, i) => <PainPoint key={i}>{item}</PainPoint>)}
            </div>
          </GlassCard>
          <p className="text-muted-foreground mt-6">Nosso foco é em empresas que querem <strong className="text-foreground">construir base para crescer.</strong></p>
        </div>
      </section>

      {/* ===== 9. ANTES & DEPOIS ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <SectionTitle className="text-center">
            O que muda quando sua empresa{" "}
            <span className="gradient-text">sai do improviso</span>
          </SectionTitle>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            <GlassCard className="border-destructive/20">
              <h3 className="font-display text-xl font-bold mb-4 text-destructive">Antes</h3>
              <div className="space-y-1">
                {[
                  "marketing sem direção",
                  "comercial desorganizado",
                  "leads sem acompanhamento",
                  "página sem estratégia",
                  "mídia sem lógica clara",
                  "tudo concentrado na sua cabeça",
                ].map((item, i) => <PainPoint key={i}>{item}</PainPoint>)}
              </div>
            </GlassCard>
            <GlassCard glow>
              <h3 className="font-display text-xl font-bold mb-4 text-primary">Depois</h3>
              <div className="space-y-1">
                {[
                  "posicionamento mais claro",
                  "funil comercial mais organizado",
                  "plano de mídia com intenção",
                  "landing page focada em conversão",
                  "CRM para acompanhar oportunidades",
                  "operação mais estruturada para crescer",
                ].map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
              </div>
            </GlassCard>
          </div>
          <p className="text-center text-muted-foreground mt-8 italic">
            Você para de apagar incêndio e começa a operar com mais inteligência.
          </p>
        </div>
      </section>

      {/* ===== 10. VALOR PERCEBIDO ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>
            Se você fosse contratar tudo isso separadamente,{" "}
            <span className="gradient-text">pagaria muito mais.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-6">Pense no custo de contratar individualmente:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "consultoria estratégica",
              "estruturação comercial",
              "planejamento de mídia",
              "copy e construção de landing page",
              "CRM",
              "implementação orientada",
              "acompanhamento da lógica de operação",
            ].map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
          </div>
          <p className="text-muted-foreground mt-8">
            Na Escale, tudo isso está organizado em um <strong className="text-foreground">único pacote</strong>, com uma entrega lógica e integrada.
          </p>
        </div>
      </section>

      {/* ===== 11. OFERTA ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <GlassCard glow className="py-14 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <img src={escaleIcon} alt="" className="h-12 mx-auto mb-6 opacity-80" />
            <SectionTitle className="text-center">
              Tudo isso por apenas{" "}
              <span className="gradient-text">12x de R$ 833,08</span>
            </SectionTitle>
            <p className="text-muted-foreground mb-8">sem juros · ou R$ 9.997 à vista</p>

            <div className="grid sm:grid-cols-2 gap-2 text-left max-w-md mx-auto mb-10">
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
              <Button size="lg" className="btn-primary-glow gap-2 h-13 px-10 font-semibold text-base">
                Quero contratar o Super Pacote <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              Uma solução pensada para quem quer organizar o presente e preparar o crescimento do negócio.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ===== 12. OBJEÇÕES ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle>Talvez você esteja pensando…</SectionTitle>
          <div className="space-y-4">
            {objections.map((obj, i) => (
              <GlassCard key={i}>
                <p className="font-display font-bold mb-2">"{obj.q}"</p>
                <p className="text-muted-foreground text-sm">{obj.a}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 13. AUTORIDADE ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <SectionTitle>
            A Escale existe para{" "}
            <span className="gradient-text">estruturar crescimento.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-4">
            Nosso trabalho não é empilhar entregas. É construir clareza, processo e direção para empresas que querem crescer de forma mais estratégica.
          </p>
          <p className="text-muted-foreground mb-4">
            Acreditamos que negócios evoluem quando marketing, comercial, conversão e gestão deixam de atuar de forma solta e passam a funcionar como sistema.
          </p>
          <p className="font-display text-lg font-bold mt-6">É isso que entregamos nesse pacote.</p>
        </div>
      </section>

      {/* ===== 14. FAQ ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <SectionTitle className="text-center">Perguntas frequentes</SectionTitle>
          <Accordion type="single" collapsible className="mt-8">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== 15. URGÊNCIA ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <SectionTitle>
            Se improvisar já começou a custar caro,{" "}
            <span className="gradient-text">essa é a hora de estruturar.</span>
          </SectionTitle>
          <p className="text-muted-foreground mb-8">
            Quanto mais um negócio cresce sem organização, mais caro fica corrigir depois. A decisão aqui não é apenas contratar uma solução. É escolher operar com mais inteligência.
          </p>
          <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="btn-primary-glow gap-2 h-13 px-8 font-semibold">
              Quero organizar meu marketing e comercial <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* ===== 16. FECHAMENTO ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <GlassCard glow className="py-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Sua empresa pode continuar no improviso.{" "}
              <span className="gradient-text">Ou pode entrar em uma nova fase.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Com a Escale, você recebe uma estrutura completa para posicionar melhor sua empresa, organizar o comercial, melhorar sua conversão e construir uma operação mais preparada para crescer.
            </p>
            <GlassCard className="inline-block mb-8 py-3 px-6">
              <p className="font-display font-bold text-lg">Super Pacote Escale</p>
              <p className="text-sm text-muted-foreground">
                Planejamento + Comercial + Mídia + LP + CRM + Passo a Passo
              </p>
              <p className="font-display text-2xl font-bold gradient-text mt-1">R$ 9.997 em até 12x sem juros</p>
            </GlassCard>
            <div className="block">
              <a href={CTA_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="btn-primary-glow gap-2 h-13 px-10 font-semibold text-base">
                  Quero contratar agora <ArrowUpRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
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
