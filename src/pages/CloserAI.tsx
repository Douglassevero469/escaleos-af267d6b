import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Target,
  Brain,
  Lightbulb,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
interface OptionDef {
  label: string;
  tag: string; // e.g. "A", "B", "C"
  reading: string;
  script: string;
  followUp?: string;
  extraBranches?: { condition: string; script: string }[];
  nextStep?: string; // key of next step to go to
}

interface StepDef {
  id: string;
  title: string;
  stageLabel: string;
  objective?: string;
  mainScript?: string;
  question?: string;
  options?: OptionDef[];
  isFreeform?: boolean;
  freeformBlocks?: { title: string; content: string }[];
  wildCards?: string[];
}

/* ──────────────────────────────────────────────
   Playbook Data
   ────────────────────────────────────────────── */
const STEPS: StepDef[] = [
  // 1. ABERTURA
  {
    id: "abertura",
    title: "Abertura da Call",
    stageLabel: "Abertura",
    objective: "Quebrar o gelo, assumir controle e preparar o diagnóstico.",
    mainScript:
      '"Perfeito, obrigado pelo seu tempo.\nPra essa conversa fazer sentido, eu vou te fazer algumas perguntas rápidas pra entender como está a operação comercial de vocês hoje. A ideia aqui é bem simples: ver onde estão os gargalos e entender se faz sentido a gente te ajudar ou não. Pode ser?"',
    question: "Como o cliente reagiu?",
    options: [
      {
        label: 'Disse "sim"',
        tag: "A",
        reading: "Cliente receptivo, seguir em frente.",
        script: '"Perfeito. Então vamos direto ao ponto."',
        nextStep: "origem",
      },
      {
        label: "Ficou travado / hesitante",
        tag: "B",
        reading: "Cliente inseguro, precisa de reassurance.",
        script:
          '"Fica tranquilo, é uma conversa bem objetiva. Eu só preciso entender como vocês estão operando hoje pra te dar um direcionamento coerente."',
        nextStep: "origem",
      },
    ],
  },
  // 2. ORIGEM DOS CLIENTES
  {
    id: "origem",
    title: "Origem dos Clientes",
    stageLabel: "Etapa 1",
    objective: "Entender como a empresa gera clientes hoje.",
    question: '"Hoje, como vocês geram clientes?"',
    options: [
      {
        label: "Rodamos tráfego pago",
        tag: "A",
        reading: "Já gera demanda. Problema tende a ser conversão, processo ou controle.",
        script:
          '"Perfeito. Então vocês já têm um canal ativo de entrada de leads, isso é ótimo.\nAgora o ponto é entender se essa demanda está realmente virando venda ou se vocês estão deixando dinheiro na mesa."',
        followUp: '"Hoje esses leads estão convertendo bem?"',
        nextStep: "conversao",
      },
      {
        label: "Indicação / orgânico",
        tag: "B",
        reading: "Existe entrada, mas sem previsibilidade e escala.",
        script:
          '"Entendi. Isso mostra que o mercado já valida o que vocês fazem, o que é bom.\nMas normalmente quando a empresa depende muito de indicação ou orgânico, ela acaba ficando sem controle de escala."',
        followUp: '"Isso acontece de forma previsível ou varia bastante de um mês pro outro?"',
        nextStep: "dependencia",
      },
      {
        label: "Não temos geração estruturada",
        tag: "C",
        reading: "Não há máquina comercial. Focar em construção de base.",
        script:
          '"Perfeito. Então hoje vocês ainda não têm um processo estruturado de aquisição.\nNesse cenário, normalmente a empresa depende de esforço pontual, indicação solta ou movimento espontâneo do mercado."',
        followUp: '"Vocês já tentaram investir em marketing ou ainda não começaram essa frente?"',
        nextStep: "sem_geracao",
      },
    ],
  },
  // 3. CONVERSÃO (2A)
  {
    id: "conversao",
    title: "Conversão de Leads",
    stageLabel: "Etapa 2A",
    objective: "Tem lead, mas precisa entender conversão.",
    question: '"Hoje vocês sabem a taxa de conversão desses leads?"',
    options: [
      {
        label: "Sim",
        tag: "A",
        reading: "Cliente mais maduro. Não tratar como iniciante. Ir para eficiência.",
        script:
          '"Ótimo. Isso já mostra um nível maior de maturidade.\nQuando a empresa conhece os números, fica mais fácil encontrar o gargalo certo."',
        followUp:
          '"E onde você sente hoje que está perdendo mais venda: na qualidade do lead, no atendimento, no follow-up ou no fechamento?"',
        nextStep: "processo",
      },
      {
        label: "Mais ou menos",
        tag: "B",
        reading: "Tem percepção, mas sem clareza real.",
        script:
          '"Perfeito. Isso geralmente significa que existe alguma leitura da operação, mas ainda sem uma visão clara do funil inteiro.\nE quando isso acontece, a empresa até sente o problema, mas não consegue atacar a causa com precisão."',
        followUp: '"Hoje vocês conseguem acompanhar com clareza em que etapa mais perdem venda?"',
        nextStep: "processo",
      },
      {
        label: "Não faço ideia",
        tag: "C",
        reading: "Falta total de gestão comercial.",
        script:
          '"Entendi. Então hoje vocês geram leads, mas não têm visibilidade real sobre o que acontece depois que eles entram.\nNa prática, isso significa que pode estar entrando oportunidade e saindo desperdício sem ninguém perceber."',
        followUp: '"Quem faz o atendimento desses leads hoje?"',
        nextStep: "processo",
        extraBranches: [
          {
            condition: "Ponte de dor",
            script: '"E aí parece que o problema está no marketing, quando muitas vezes o problema está no processo comercial."',
          },
        ],
      },
    ],
  },
  // 4. DEPENDÊNCIA (2B)
  {
    id: "dependencia",
    title: "Dependência de Indicação",
    stageLabel: "Etapa 2B",
    objective: "Avaliar vulnerabilidade da fonte de clientes.",
    question: '"Se as indicações pararem hoje, o que acontece com as vendas de vocês?"',
    options: [
      {
        label: "Cai bastante",
        tag: "A",
        reading: "Dor forte. Cliente dependente de algo que não controla.",
        script:
          '"Perfeito. Então hoje boa parte da sua operação depende de uma fonte que vocês não controlam.\nE esse é um ponto crítico, porque enquanto a empresa não domina a própria aquisição, ela fica vulnerável."',
        followUp: '"Hoje vocês já tentaram criar uma operação mais previsível de geração de demanda?"',
        nextStep: "processo",
        extraBranches: [
          { condition: "Reforço", script: '"Ou seja, vocês até vendem, mas sem previsibilidade real."' },
        ],
      },
      {
        label: "Diminui, mas ainda entra",
        tag: "B",
        reading: "Há outras fontes, mas sem consistência.",
        script:
          '"Entendi. Então existe algum movimento de entrada além da indicação, mas ainda assim sem uma estrutura clara.\nNesse cenário, a empresa costuma continuar vendendo, só que sem conseguir planejar crescimento."',
        followUp: '"E hoje você sente que consegue prever quantos clientes entram por mês ou ainda varia bastante?"',
        nextStep: "processo",
      },
      {
        label: "Continua normal",
        tag: "C",
        reading: "Precisa investigar outras fontes.",
        script: '"Interessante. Então existe outra fonte de aquisição sustentando o resultado além da indicação."',
        followUp: '"De onde mais vêm seus clientes hoje?"',
        nextStep: "processo",
        extraBranches: [
          {
            condition: "Se responder tráfego",
            script: '"Perfeito, então além do orgânico vocês já têm um canal pago. Aí vale entender se o problema está na estrutura de conversão."',
          },
          {
            condition: "Se responder prospecção/parcerias",
            script: '"Ótimo. Então vocês já têm mais de uma frente, e agora o ponto é entender se isso está organizado como processo ou se ainda funciona de forma solta."',
          },
        ],
      },
    ],
  },
  // 5. SEM GERAÇÃO (2C)
  {
    id: "sem_geracao",
    title: "Sem Geração Estruturada",
    stageLabel: "Etapa 2C",
    objective: "Investigar tentativas anteriores de marketing.",
    question: '"Hoje vocês já tentaram investir em marketing?"',
    options: [
      {
        label: "Sim, mas não funcionou",
        tag: "A",
        reading: "Cliente frustrado. Não contradizer. Validar e reposicionar.",
        script:
          '"Faz sentido. Isso é muito comum.\nO que normalmente acontece não é que marketing não funciona — é que ele entra em uma operação que ainda não tem estrutura comercial pra sustentar a conversão."',
        followUp: '"Na época que vocês investiram, existia um processo comercial bem definido ou era mais no improviso?"',
        nextStep: "processo",
        extraBranches: [
          {
            condition: "Reforço",
            script: '"Ou seja, o lead até chega, mas a empresa não tem processo, script, acompanhamento e controle pra transformar aquilo em venda."',
          },
        ],
      },
      {
        label: "Não ainda",
        tag: "B",
        reading: "Lead em fase inicial, mas com oportunidade de construção.",
        script:
          '"Perfeito. Então hoje vocês ainda não construíram uma máquina de aquisição.\nNesse cenário, o ideal não é só começar a anunciar — é estruturar a base primeiro pra não queimar investimento."',
        followUp: '"Hoje, se começassem a gerar leads amanhã, vocês teriam processo pra atender e converter isso bem?"',
        nextStep: "processo",
      },
      {
        label: "Testamos pouco",
        tag: "C",
        reading: "Pouca consistência e pouca base de decisão.",
        script:
          '"Entendi. Então houve tentativa, mas sem continuidade suficiente pra virar sistema.\nE quando não existe processo por trás, marketing vira teste solto, não operação."',
        followUp: '"Hoje você sente que o problema está mais em gerar demanda ou em não ter estrutura pra sustentar a demanda?"',
        nextStep: "processo",
      },
    ],
  },
  // 6. PROCESSO COMERCIAL
  {
    id: "processo",
    title: "Processo Comercial",
    stageLabel: "Etapa 3",
    objective: "Avaliar nível de estrutura de vendas.",
    question: '"Hoje existe um processo de vendas definido ou cada um vende do seu jeito?"',
    options: [
      {
        label: "Temos processo",
        tag: "A",
        reading: "Cliente mais maduro. Ir fundo em aderência e execução.",
        script:
          '"Ótimo. Ter processo já coloca vocês na frente de muita empresa.\nAgora o ponto principal é entender se esse processo está realmente sendo seguido e gerando previsibilidade."',
        followUp: '"Esse processo está sendo seguido de forma consistente pelo time ou ainda depende muito do perfil de quem atende?"',
        nextStep: "crm",
        extraBranches: [
          {
            condition: 'Se "depende de quem atende"',
            script: '"Então vocês têm um processo desenhado, mas ainda não totalmente operacionalizado.\nNa prática, o resultado continua ficando na mão da pessoa, e não do sistema."',
          },
          {
            condition: 'Se "está sendo seguido"',
            script: '"Perfeito. E hoje vocês têm clareza dos gargalos dentro desse processo?"',
          },
        ],
      },
      {
        label: "Mais ou menos",
        tag: "B",
        reading: "Processo informal. Há intenção, mas não padronização.",
        script:
          '"Perfeito. Quando a resposta é \'mais ou menos\', normalmente existe uma ideia de processo, mas não uma operação realmente padronizada.\nOu seja: algumas coisas estão combinadas, mas ainda não existe uma estrutura forte o suficiente pra garantir consistência."',
        followUp: '"Hoje, o que mais varia: abordagem, tempo de resposta, follow-up ou fechamento?"',
        nextStep: "crm",
        extraBranches: [
          { condition: "Reforço", script: '"E sem consistência, o comercial vira oscilação."' },
        ],
      },
      {
        label: "Não",
        tag: "C",
        reading: "Caos comercial. Pode aprofundar na consequência.",
        script:
          '"Entendi. Então hoje a venda depende muito do improviso e da experiência individual.\nIsso normalmente gera três problemas: atendimento inconsistente, perda de oportunidade e dificuldade total de escalar."',
        followUp: '"Hoje quem atende sabe exatamente o que falar ou cada conversa segue de um jeito?"',
        nextStep: "crm",
        extraBranches: [
          {
            condition: "Reforço de dor",
            script: '"Porque o que funciona não está documentado, e o que não funciona continua se repetindo."',
          },
        ],
      },
    ],
  },
  // 7. CRM
  {
    id: "crm",
    title: "Controle / CRM",
    stageLabel: "Etapa 4",
    objective: "Avaliar nível de controle e rastreabilidade.",
    question: '"Vocês usam CRM ou controlam no WhatsApp?"',
    options: [
      {
        label: "Usamos CRM",
        tag: "A",
        reading: "Cliente com ferramenta, mas talvez sem operação.",
        script:
          '"Ótimo. Isso já mostra um nível melhor de organização.\nAgora a ferramenta sozinha não resolve — o mais importante é entender se ela está sendo usada de forma estratégica."',
        followUp: '"Vocês acompanham pipeline, taxas, tempo de resposta e avanço das oportunidades por lá?"',
        nextStep: "dor",
        extraBranches: [
          {
            condition: 'Se "sim"',
            script: '"Perfeito. Então provavelmente o ponto de melhoria está mais em otimização de processo e conversão do que em estrutura básica."',
          },
          {
            condition: 'Se "não muito"',
            script: '"Então hoje o CRM existe, mas ainda não virou uma ferramenta real de gestão.\nNa prática, ele está mais como registro do que como inteligência comercial."',
          },
        ],
      },
      {
        label: "Planilha",
        tag: "B",
        reading: "Semi-organizado, mas sem fluidez operacional.",
        script:
          '"Entendi. A planilha até ajuda em algum nível de controle, mas ela não acompanha a operação comercial em tempo real.\nEla depende muito de disciplina manual e quase sempre acaba ficando desatualizada."',
        followUp: '"Hoje vocês conseguem visualizar com clareza em que etapa cada oportunidade está?"',
        nextStep: "dor",
        extraBranches: [
          { condition: "Reforço", script: '"E quando a operação cresce, a planilha começa a travar mais do que ajudar."' },
        ],
      },
      {
        label: "Só WhatsApp",
        tag: "C",
        reading: "Dor máxima.",
        script:
          '"Perfeito. Então hoje o comercial de vocês está praticamente sem rastreabilidade.\nO lead entra, conversa acontece, mas não existe um sistema organizado pra acompanhar tudo isso."',
        followUp: '"Hoje vocês já perderam lead por demora, esquecimento ou falta de follow-up?"',
        nextStep: "dor",
        extraBranches: [
          { condition: "Reforço de dor", script: '"Esse é um dos maiores pontos de perda de venda nas empresas, porque sem controle não existe previsibilidade, nem melhoria."' },
          { condition: 'Se "sim"', script: '"É exatamente esse tipo de vazamento que trava o crescimento."' },
          { condition: 'Se "provavelmente"', script: '"Normalmente quando não existe CRM, isso já acontece mesmo sem a empresa perceber."' },
          { condition: 'Se "não"', script: '"Mesmo que hoje não fique tão visível, a ausência de controle limita a escala da operação."' },
        ],
      },
    ],
  },
  // 8. APROFUNDAMENTO DE DOR
  {
    id: "dor",
    title: "Aprofundamento de Dor",
    stageLabel: "Etapa 5",
    objective: "Consolidar o diagnóstico antes da virada de chave.",
    mainScript:
      '"Perfeito. Pelo que você está me trazendo, o cenário de vocês hoje não parece ser falta de potencial.\nO que existe é uma operação comercial que ainda não está totalmente estruturada pra transformar demanda em previsibilidade."',
    question: "Qual é o cenário principal do cliente?",
    options: [
      {
        label: "Problema é geração",
        tag: "A",
        reading: "Falta máquina de aquisição.",
        script: '"Vocês precisam construir uma máquina de aquisição com lógica e processo."',
        nextStep: "virada",
      },
      {
        label: "Problema é conversão",
        tag: "B",
        reading: "Tem entrada, perde eficiência no funil.",
        script: '"Vocês já têm entrada, mas estão perdendo eficiência no meio do caminho."',
        nextStep: "virada",
      },
      {
        label: "Problema é controle",
        tag: "C",
        reading: "Comercial existe, mas sem gestão.",
        script: '"O comercial existe, mas sem gestão clara, então o crescimento fica limitado."',
        nextStep: "virada",
      },
      {
        label: "Problema é time",
        tag: "D",
        reading: "Depende de pessoas, não de processo.",
        script: '"Hoje a operação depende mais das pessoas do que de um processo forte."',
        nextStep: "virada",
      },
    ],
  },
  // 9. VIRADA DE CHAVE
  {
    id: "virada",
    title: "Virada de Chave",
    stageLabel: "Etapa 6",
    objective: "Frase central do pitch.",
    mainScript:
      '"Então, com base no que você me trouxe, o problema hoje não é marketing.\nO problema é falta de estrutura comercial."',
    isFreeform: true,
    freeformBlocks: [
      { title: "Pausa curta", content: "(Deixe o silêncio trabalhar)" },
      { title: "Continuação", content: '"E é exatamente isso que a gente resolve."' },
    ],
  },
  // 10. APRESENTAÇÃO DA SOLUÇÃO
  {
    id: "solucao",
    title: "Apresentação da Solução",
    stageLabel: "Etapa 7",
    objective: "Apresentar o modelo de entrega.",
    mainScript:
      '"O que a gente faz é entrar na empresa e estruturar o comercial de ponta a ponta.\nNão é só gerar lead. Não é só subir campanha.\nA gente organiza toda a lógica da venda."',
    isFreeform: true,
    freeformBlocks: [
      {
        title: "Blocos da Solução",
        content:
          '"A gente atua em quatro frentes principais:\n\n🎯 Estratégia — pra definir posicionamento, comunicação e oferta\n\n📞 Comercial — pra estruturar processo, atendimento, script e objeções\n\n🚀 Aquisição — pra gerar demanda com landing page, mídia e campanha\n\n📊 Controle — pra organizar CRM, pipeline e acompanhamento"',
      },
      {
        title: "Fechamento da ideia",
        content: '"Ou seja, a gente monta uma operação comercial que faz sentido do começo ao fim."',
      },
    ],
  },
  // 11. CONEXÃO COM A DOR
  {
    id: "conexao",
    title: "Conexão com a Dor",
    stageLabel: "Etapa 8",
    objective: "Conectar a solução com o que ouviu do cliente.",
    mainScript: '"No seu caso especificamente, o que mais chama atenção é [INSERIR DOR PRINCIPAL]."',
    isFreeform: true,
    freeformBlocks: [
      { title: "Exemplo 1", content: '"…vocês já geram demanda, mas não têm clareza do funil."' },
      { title: "Exemplo 2", content: '"…depender de indicação sem previsibilidade."' },
      { title: "Exemplo 3", content: '"…a ausência de processo comercial claro."' },
      { title: "Exemplo 4", content: '"…o maior vazamento está no controle e acompanhamento das oportunidades."' },
      {
        title: "Continuação",
        content: '"Então o nosso trabalho entra justamente pra corrigir isso na raiz, e não só maquiar o problema trazendo mais lead."',
      },
    ],
  },
  // 12. TRANSIÇÃO PARA OFERTA
  {
    id: "oferta_transicao",
    title: "Transição para a Oferta",
    stageLabel: "Etapa 9",
    objective: "Posicionar como projeto de implantação.",
    mainScript:
      '"Na prática, isso funciona como um projeto de implantação.\nA gente estrutura toda essa operação com você, organiza o comercial, coloca o processo de pé e deixa o negócio preparado pra vender com mais consistência."',
    isFreeform: true,
    freeformBlocks: [
      { title: "Reforço", content: '"Ou seja, não é uma entrega solta. É implementação."' },
    ],
  },
  // 13. PREÇO
  {
    id: "preco",
    title: "Preço / Investimento",
    stageLabel: "Etapa 10",
    objective: "Apresentar valor do investimento.",
    mainScript:
      '"Se você fosse montar tudo isso separado — estratégia, plano comercial, manual de vendas, landing page, tráfego, CRM e estrutura — você passaria com facilidade de um investimento muito maior."',
    isFreeform: true,
    freeformBlocks: [
      { title: "Pausa", content: "(Deixe o silêncio trabalhar)" },
      {
        title: "Valor",
        content:
          '"Mas o nosso modelo é de implantação completa.\nHoje, pra estruturar tudo isso, o investimento fica entre 8 e 10 mil reais, dependendo do escopo exato da operação."',
      },
      { title: "Depois", content: "Silêncio. Espere o cliente falar." },
    ],
  },
  // 14. OBJEÇÕES
  {
    id: "objecoes",
    title: "Respostas para Objeções",
    stageLabel: "Etapa 11",
    objective: "Respostas prontas para as objeções mais comuns.",
    question: "Qual objeção o cliente trouxe?",
    options: [
      {
        label: '"Preciso pensar"',
        tag: "1",
        reading: "Identificar se é valor ou timing.",
        script:
          '"Perfeito, e faz sentido pensar.\nMas me deixa só entender uma coisa: você sente que precisa pensar porque ainda não enxergou valor suficiente, ou porque sabe que precisa resolver isso mas está avaliando o momento?"',
        nextStep: "fechamento",
        extraBranches: [
          { condition: 'Se "momento"', script: '"Entendi. Então o ponto não é se precisa, e sim quando vai atacar isso."' },
          { condition: 'Se "quero avaliar melhor"', script: '"Perfeito. O que exatamente você sente que precisa avaliar melhor?"' },
        ],
      },
      {
        label: '"Tá caro"',
        tag: "2",
        reading: "Reposicionar valor vs. custo da inação.",
        script:
          '"Entendi. Mas caro comparado a quê?\nPorque hoje vocês já pagam um preço alto pela desorganização — em lead perdido, oportunidade mal atendida e crescimento travado."',
        nextStep: "fechamento",
        extraBranches: [
          {
            condition: "Continuação",
            script: '"O investimento não é sobre criar custo.\nÉ sobre parar de perder venda por falta de estrutura."',
          },
        ],
      },
      {
        label: '"Agora não é prioridade"',
        tag: "3",
        reading: "Levar à consciência de que o gargalo continua custando.",
        script:
          '"Perfeito. E eu respeito isso.\nMas só pra entender com clareza: não é prioridade porque vocês já estão com a operação resolvida, ou porque ainda vão continuar tocando mesmo sabendo que existe esse gargalo?"',
        nextStep: "fechamento",
        extraBranches: [
          {
            condition: "Se assumir que existe gargalo",
            script: '"Então a questão não é prioridade técnica. É decisão de enfrentar agora ou deixar o problema continuar custando."',
          },
        ],
      },
      {
        label: '"Quero conversar com sócio/equipe"',
        tag: "4",
        reading: "Natural. Oferecer apoio para a conversa interna.",
        script:
          '"Perfeito, super natural.\nNesse caso, o ideal é que essa conversa aconteça com clareza. Porque se você for levar isso internamente, precisa levar a lógica certa: hoje vocês não estão contratando marketing, estão estruturando uma máquina comercial."',
        nextStep: "fechamento",
        extraBranches: [
          {
            condition: "Continuação",
            script: '"Se fizer sentido, eu posso até te ajudar a organizar os pontos principais pra essa conversa interna."',
          },
        ],
      },
    ],
  },
  // 15. FECHAMENTO
  {
    id: "fechamento",
    title: "Fechamento",
    stageLabel: "Etapa 12",
    objective: "Conduzir para a decisão final.",
    question: '"Faz sentido pra você organizar isso agora?"',
    options: [
      {
        label: "Faz sentido",
        tag: "A",
        reading: "Cliente comprou. Formalizar.",
        script: '"Perfeito. Então o próximo passo é a gente alinhar o escopo final, formalizar e iniciar a implantação."',
        nextStep: "wildcards",
      },
      {
        label: "Talvez",
        tag: "B",
        reading: "Precisa resolver a dúvida específica.",
        script: '"Perfeito. O que te deixa em dúvida hoje?"',
        nextStep: "wildcards",
        extraBranches: [
          { condition: "Depois da resposta", script: '"Entendi. Então vamos atacar essa dúvida objetivamente."' },
        ],
      },
      {
        label: "Agora não",
        tag: "C",
        reading: "Entender o porquê real.",
        script: '"Perfeito. Só pra eu não interpretar errado: é uma questão de prioridade, caixa, timing ou convicção?"',
        nextStep: "wildcards",
      },
    ],
  },
  // 16. WILDCARDS
  {
    id: "wildcards",
    title: "Frases Curingas",
    stageLabel: "Final",
    objective: "Frases para usar a qualquer momento da call.",
    isFreeform: true,
    wildCards: [
      '"Hoje vocês não parecem ter um problema de potencial, e sim de estrutura."',
      '"O problema não é gerar lead. É o que acontece depois que ele entra."',
      '"Ferramenta sem processo vira só um lugar bonito pra guardar informação."',
      '"Venda não pode depender do talento isolado de alguém. Precisa depender de método."',
      '"Quanto mais tempo a operação roda assim, mais venda escorre sem ficar visível."',
      '"A gente não entra pra fazer peça ou campanha solta. A gente entra pra montar a máquina."',
    ],
  },
];

// Linear step order for progress and sequential navigation on freeform steps
const STEP_ORDER = [
  "abertura", "origem", "conversao", "dependencia", "sem_geracao",
  "processo", "crm", "dor", "virada", "solucao", "conexao",
  "oferta_transicao", "preco", "objecoes", "fechamento", "wildcards",
];

/* ──────────────────────────────────────────────
   Clipboard helper
   ────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text.replace(/^"|"$/g, ""));
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function CloserAI() {
  const [currentStepId, setCurrentStepId] = useState("abertura");
  const [selectedOption, setSelectedOption] = useState<OptionDef | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const step = STEPS.find((s) => s.id === currentStepId)!;
  const stepIndex = STEP_ORDER.indexOf(currentStepId);
  const progress = ((stepIndex) / (STEP_ORDER.length - 1)) * 100;

  const goToStep = useCallback(
    (nextId: string) => {
      setHistory((h) => [...h, currentStepId]);
      setSelectedOption(null);
      setCurrentStepId(nextId);
    },
    [currentStepId]
  );

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setSelectedOption(null);
    setCurrentStepId(prev);
  }, [history]);

  const restart = useCallback(() => {
    setCurrentStepId("abertura");
    setSelectedOption(null);
    setHistory([]);
  }, []);

  // For freeform steps, find the next step in STEP_ORDER
  const nextFreeformStepId = STEP_ORDER[stepIndex + 1] || null;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            CloserAI
          </h1>
          <p className="text-sm text-muted-foreground">Playbook de Call Comercial — fluxo guiado</p>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <RotateCcw className="h-4 w-4 mr-1" /> Voltar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reiniciar
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{step.stageLabel} — {step.title}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">{step.stageLabel}</Badge>
            <CardTitle className="text-lg">{step.title}</CardTitle>
          </div>
          {step.objective && (
            <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-muted/50">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{step.objective}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main script */}
          {step.mainScript && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fala do Closer</span>
                <CopyButton text={step.mainScript} />
              </div>
              <p className="text-sm whitespace-pre-line leading-relaxed">{step.mainScript.replace(/^"|"$/g, "")}</p>
            </div>
          )}

          {/* Question */}
          {step.question && (
            <div className="p-3 rounded-lg bg-accent/50 border border-accent">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-foreground" />
                <span className="text-sm font-medium">{step.question.replace(/^"|"$/g, "")}</span>
              </div>
            </div>
          )}

          {/* Options */}
          {step.options && !selectedOption && (
            <div className="grid gap-3">
              {step.options.map((opt) => (
                <button
                  key={opt.tag}
                  onClick={() => setSelectedOption(opt)}
                  className="group text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {opt.tag}
                    </div>
                    <span className="font-medium text-sm">{opt.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected option detail */}
          {selectedOption && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Chosen badge */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Resposta: {selectedOption.label}</span>
                <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setSelectedOption(null)}>
                  Escolher outra
                </Button>
              </div>

              {/* Strategic reading */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Leitura Estratégica</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedOption.reading}</p>
              </div>

              {/* Script */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fala do Closer</span>
                  <CopyButton text={selectedOption.script} />
                </div>
                <p className="text-sm whitespace-pre-line leading-relaxed">{selectedOption.script.replace(/^"|"$/g, "")}</p>
              </div>

              {/* Extra branches */}
              {selectedOption.extraBranches && selectedOption.extraBranches.length > 0 && (
                <div className="space-y-2">
                  {selectedOption.extraBranches.map((b, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">{b.condition}</span>
                        <CopyButton text={b.script} />
                      </div>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{b.script.replace(/^"|"$/g, "")}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Follow-up question */}
              {selectedOption.followUp && (
                <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Próxima Pergunta</span>
                    <CopyButton text={selectedOption.followUp} />
                  </div>
                  <p className="text-sm mt-1 font-medium">{selectedOption.followUp.replace(/^"|"$/g, "")}</p>
                </div>
              )}

              {/* Next step button */}
              {selectedOption.nextStep && (
                <Button className="w-full" onClick={() => goToStep(selectedOption.nextStep!)}>
                  Avançar para próxima etapa <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* Freeform blocks */}
          {step.isFreeform && step.freeformBlocks && (
            <div className="space-y-3">
              {step.freeformBlocks.map((block, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{block.title}</span>
                    <CopyButton text={block.content} />
                  </div>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{block.content.replace(/^"|"$/g, "")}</p>
                </div>
              ))}
            </div>
          )}

          {/* Wildcards */}
          {step.wildCards && (
            <div className="space-y-2">
              {step.wildCards.map((wc, i) => (
                <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed flex-1">{wc.replace(/^"|"$/g, "")}</p>
                  <CopyButton text={wc} />
                </div>
              ))}
            </div>
          )}

          {/* Freeform next button */}
          {step.isFreeform && nextFreeformStepId && (
            <Button className="w-full" onClick={() => goToStep(nextFreeformStepId)}>
              Avançar para próxima etapa <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Roadmap mini */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Estrutura da Call</p>
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s) => {
              const isActive = s.id === currentStepId;
              const visited = history.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (visited || isActive) return;
                    goToStep(s.id);
                  }}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-medium transition-all border",
                    isActive && "bg-primary text-primary-foreground border-primary",
                    visited && !isActive && "bg-primary/10 text-primary border-primary/30 cursor-pointer",
                    !isActive && !visited && "bg-muted text-muted-foreground border-transparent cursor-default"
                  )}
                >
                  {s.stageLabel}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
