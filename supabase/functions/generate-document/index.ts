import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ────────────────────────────────────────────────────────────────────

interface BriefingData {
  nomeEmpresa: string;
  nichoAtuacao: string;
  tempoMercado: string;
  regiaoAtuacao: string;
  instagramEmpresa: string;
  siteEmpresa: string;
  faturamentoAtual: string;
  metaFaturamento: string;
  ticketMedio: string;
  orcamentoAnuncios: string;
  nomeProduto: string;
  precoProduto: string;
  garantia: string;
  diferenciais: string[];
  perfilClienteIdeal: string;
  doresPublico: string[];
  desejosPublico: string[];
  concorrentes: { nome: string; pontoFraco: string; pontoForte: string; precoEstimado: string; siteConcorrente: string }[];
  equipeVendas: string;
  ferramentas: string;
  gargalo: string;
  objecoes: string[];
  tomDeVoz: string;
  canaisAtendimento: string[];
  objetivoCampanha: string;
  plataformasAnuncio: string[];
  jaInvesteAnuncios: string;
  investimentoMidia: string;
  resultadosAtuais: string;
  coresMarca: string;
  provaSocial: string;
}

const DOC_TYPES = ["planejamento","concorrentes","funil","midia","criativos","playbook","script","objecoes","landing_page","followup","calendario_editorial"] as const;
type DocType = typeof DOC_TYPES[number];

const DOC_TITLES: Record<DocType, string> = {
  planejamento: "Planejamento Estratégico",
  concorrentes: "Análise de Concorrentes",
  funil: "Funil de Vendas",
  midia: "Plano de Mídia",
  criativos: "Criativos Prontos",
  playbook: "Playbook Comercial",
  script: "Script de Vendas",
  objecoes: "Tabela de Objeções",
  landing_page: "Landing Page de Alta Conversão",
  followup: "Cadência de Mensagens Follow-up",
  calendario_editorial: "Calendário Editorial de Conteúdo",
};

// ── Briefing to text ─────────────────────────────────────────────────────────

function briefingToText(b: BriefingData): string {
  return `
EMPRESA: ${b.nomeEmpresa}
NICHO: ${b.nichoAtuacao}
TEMPO DE MERCADO: ${b.tempoMercado}
REGIÃO DE ATUAÇÃO: ${b.regiaoAtuacao || "Não informado"}
INSTAGRAM: ${b.instagramEmpresa || "Não informado"}
SITE: ${b.siteEmpresa || "Não informado"}
FATURAMENTO ATUAL: ${b.faturamentoAtual}
META DE FATURAMENTO: ${b.metaFaturamento}
TICKET MÉDIO: ${b.ticketMedio}
ORÇAMENTO MENSAL EM ANÚNCIOS: ${b.orcamentoAnuncios}
PRODUTO PRINCIPAL: ${b.nomeProduto} — ${b.precoProduto}
GARANTIA: ${b.garantia}
DIFERENCIAIS: ${(b.diferenciais||[]).filter(Boolean).join("; ")}
PERFIL DO CLIENTE IDEAL: ${b.perfilClienteIdeal}
DORES DO PÚBLICO: ${(b.doresPublico||[]).filter(Boolean).join("; ")}
DESEJOS DO PÚBLICO: ${(b.desejosPublico||[]).filter(Boolean).join("; ")}
CONCORRENTES: ${(b.concorrentes||[]).filter(c => c.nome).map(c => `${c.nome} (site: ${c.siteConcorrente || "não informado"}; fraqueza: ${c.pontoFraco}; ponto forte: ${c.pontoForte || "não informado"}; preço estimado: ${c.precoEstimado || "não informado"})`).join("; ")}
EQUIPE DE VENDAS: ${b.equipeVendas}
CANAIS DE ATENDIMENTO: ${(b.canaisAtendimento || []).filter(Boolean).join(", ") || "Não informado"}
FERRAMENTAS: ${b.ferramentas}
GARGALO PRINCIPAL: ${b.gargalo}
OBJEÇÕES FREQUENTES: ${(b.objecoes||[]).filter(Boolean).join("; ")}
TOM DE VOZ: ${b.tomDeVoz}
OBJETIVO DA CAMPANHA: ${b.objetivoCampanha || "Não informado"}
PLATAFORMAS DE ANÚNCIO: ${(b.plataformasAnuncio || []).filter(Boolean).join(", ") || "Não informado"}
JÁ INVESTE EM ANÚNCIOS: ${b.jaInvesteAnuncios || "Não informado"}
INVESTIMENTO MENSAL EM MÍDIA: ${b.investimentoMidia || "Não informado"}
RESULTADOS ATUAIS COM ANÚNCIOS: ${b.resultadosAtuais || "Não informado"}
CORES DA MARCA: ${b.coresMarca || "Não informado"}
PROVA SOCIAL DISPONÍVEL: ${b.provaSocial || "Não informado"}
`.trim();
}

// ── Build prompt ─────────────────────────────────────────────────────────────

function buildPrompt(docType: DocType, briefing: BriefingData): string {
  const ctx = briefingToText(briefing);
  const empresa = briefing.nomeEmpresa;
  const regiao = briefing.regiaoAtuacao || "Brasil";
  const plataformas = (briefing.plataformasAnuncio || []).filter(Boolean).join(", ") || "Meta Ads";
  const canais = (briefing.canaisAtendimento || []).filter(Boolean).join(", ") || "WhatsApp";
  const concorrentesNomes = (briefing.concorrentes||[]).filter(c => c.nome).map(c => c.nome).join(", ") || "concorrentes do mercado";
  const dor1 = (briefing.doresPublico||[]).filter(Boolean)[0] || "principal dor do público";
  const dor2 = (briefing.doresPublico||[]).filter(Boolean)[1] || "segunda dor do público";
  const desejo1 = (briefing.desejosPublico||[]).filter(Boolean)[0] || "principal desejo do público";

  const instrucaoGeral = `Você é um especialista sênior em estratégia comercial, marketing de performance e vendas consultivas. Você está criando materiais profissionais para a agência Escale entregar ao cliente ${empresa}.

REGRAS ABSOLUTAS:
1. NUNCA use teoria genérica ou frases vagas. Cada frase deve conter dados reais do briefing.
2. O documento deve ter NO MÁXIMO 2.500 palavras. Seja denso, objetivo e direto ao ponto. Priorize qualidade sobre quantidade.
3. Use os nomes reais: empresa, produto, preço, concorrentes, região, canais.
4. Inclua tabelas, listas numeradas, exemplos concretos, scripts com falas exatas.
5. Escreva em português brasileiro no tom indicado no briefing.
6. Formate em Markdown com hierarquia clara (# ## ### ####).
7. O material deve ser tão completo que o cliente possa executar sem precisar de mais nada.

BRIEFING COMPLETO DO CLIENTE:
${ctx}

---
`;

  const prompts: Record<DocType, string> = {
    planejamento: `${instrucaoGeral}
Crie o documento "Planejamento Estratégico Comercial Aplicado — ${empresa}".

Este documento é o guia fundacional de toda a operação. Ele deve ser tão completo que o dono da empresa consiga entregar para qualquer membro da equipe e essa pessoa entenda exatamente o que fazer.

Estrutura obrigatória:

# Planejamento Estratégico Comercial Aplicado
## ${empresa} | ${regiao}

### Introdução Executiva
Escreva 2 parágrafos contextualizando a situação atual da empresa (faturamento de ${briefing.faturamentoAtual}, gargalo principal: "${briefing.gargalo}") e o objetivo deste planejamento (chegar em ${briefing.metaFaturamento}).

### 1. Diagnóstico Atual — Onde Estamos
Crie uma análise profunda com:
- Situação financeira atual (faturamento, ticket médio de ${briefing.ticketMedio}, gap para a meta)
- Análise do produto/serviço: ${briefing.nomeProduto} por ${briefing.precoProduto}
- Diagnóstico da equipe de vendas: ${briefing.equipeVendas}
- Diagnóstico do processo comercial atual (gargalo: "${briefing.gargalo}")
- Diagnóstico da presença digital (${briefing.instagramEmpresa ? `Instagram: ${briefing.instagramEmpresa}` : "sem presença digital estruturada"})
- Tabela de diagnóstico: Área | Situação Atual | Situação Ideal | Gap

### 2. Análise SWOT Aplicada
Crie uma análise SWOT completa e específica para ${empresa} no nicho ${briefing.nichoAtuacao} em ${regiao}:
- Forças: baseadas nos diferenciais reais (${(briefing.diferenciais||[]).filter(Boolean).join(", ")})
- Fraquezas: baseadas no gargalo e na situação atual
- Oportunidades: baseadas no mercado de ${regiao} e nas dores do público (${dor1}, ${dor2})
- Ameaças: baseadas nos concorrentes (${concorrentesNomes})
Para cada item, inclua pelo menos 4 pontos detalhados com plano de ação.

### 3. Posicionamento Estratégico
- Proposta de Valor Única de ${empresa} (uma frase poderosa que diferencia da concorrência)
- Golden Circle aplicado: Por quê, Como, O quê
- Mensagem central para ${plataformas}
- Tom de voz e linguagem: ${briefing.tomDeVoz}
- Como se posicionar contra ${concorrentesNomes}

### 4. Objetivos e OKRs — 90 Dias
Crie 3 Objetivos com 3 Resultados-Chave cada, todos com números reais:
- Objetivo 1: Receita (de ${briefing.faturamentoAtual} para ${briefing.metaFaturamento})
- Objetivo 2: Geração de Leads (volume necessário dado o ticket de ${briefing.ticketMedio})
- Objetivo 3: Conversão (taxa necessária para bater a meta)
Inclua tabela: Objetivo | KR | Baseline | Meta | Prazo | Responsável

### 5. Roadmap de Execução — 90 Dias
Crie um cronograma detalhado semana a semana (12 semanas).

### 6. Plano de Ação — Primeiros 30 Dias (Detalhado)
Crie um plano dia a dia para os primeiros 30 dias.

### 7. Métricas e KPIs do Negócio
Tabela completa com: Métrica | Valor Atual | Meta 30 dias | Meta 60 dias | Meta 90 dias | Como Medir | Frequência

### 8. Divisão de Responsabilidades
Tabela clara: Atividade | Responsável (Agência ou ${empresa}) | Prazo | Ferramenta | Entregável

### 9. Riscos e Planos de Contingência
Liste os 5 principais riscos e o plano de ação para cada um.

### 10. Próximos Passos Imediatos
Liste as 10 ações que devem ser feitas nas próximas 48 horas, em ordem de prioridade.`,

    concorrentes: `${instrucaoGeral}
Crie o documento "Análise Competitiva Profunda — ${empresa}".

Este documento deve ser tão detalhado que o time de vendas de ${empresa} saiba exatamente como atacar cada concorrente e como se posicionar em qualquer conversa de vendas.

# Análise Competitiva Profunda
## ${empresa} vs. Mercado | ${regiao}

### Introdução: O Cenário Competitivo em ${regiao}

### 1. Mapa Competitivo Completo
Crie uma tabela comparativa detalhada com todos os concorrentes informados (${concorrentesNomes}) e ${empresa}:
Colunas: Empresa | Posicionamento | Preço Estimado | Ponto Forte | Ponto Fraco | Público-Alvo | Canal Principal | Diferencial Percebido | Ameaça

### 2. Análise Individual de Cada Concorrente
Para cada concorrente informado no briefing, crie uma seção dedicada com posicionamento, análise digital, pontos fortes/fracos, como atacar, mensagem de diferenciação.

### 3. Análise de Gaps de Mercado
Identifique pelo menos 5 oportunidades que NENHUM concorrente está explorando em ${regiao}.

### 4. Posicionamento Único de ${empresa}
- Proposta de Valor Irresistível
- Os 3 Pilares de Diferenciação: baseados nos diferenciais reais (${(briefing.diferenciais||[]).filter(Boolean).join(", ")})
- Narrativa do Inimigo Comum
- Prova Social vs. Concorrentes

### 5. Análise SWOT Competitiva Consolidada

### 6. Estratégia de Conquista de Mercado

### 7. Arsenal de Diferenciação (Frases Prontas)
Crie pelo menos 15 frases prontas para usar em vendas, anúncios e redes sociais.

### 8. Monitoramento Competitivo
Checklist mensal para monitorar os concorrentes.`,

    funil: `${instrucaoGeral}
Crie o documento "Arquitetura do Funil de Vendas — ${empresa}".

Este documento deve ser o manual operacional completo do processo de vendas.

# Arquitetura do Funil de Vendas
## ${empresa} | ${canais}

### 1. Visão Geral do Funil (Diagrama Textual)
### 2. Etapa 1 — TOPO: Atração e Geração de Leads
- Canais: ${plataformas}
- Mensagens de Atração baseadas nas dores (${dor1}, ${dor2})
- Conteúdo Orgânico: 10 ideias de posts
- Isca Digital para o nicho ${briefing.nichoAtuacao}

### 3. Etapa 2 — MEIO: Qualificação
- Critérios B.A.N.T. para ${briefing.nomeProduto} por ${briefing.precoProduto}
- Perguntas de Qualificação com scripts exatos
- Script de Qualificação via ${canais}

### 4. Etapa 3 — DIAGNÓSTICO: A Reunião de Descoberta
- Roteiro SPIN completo

### 5. Etapa 4 — PROPOSTA: Apresentação e Negociação
- Como apresentar ${briefing.precoProduto}, garantia (${briefing.garantia}), prova social

### 6. Etapa 5 — FECHAMENTO
- 5 técnicas com scripts exatos

### 7. Pós-Venda e Retenção
### 8. Cadência de Follow-up Completa (21 Dias)
### 9. Gestão no CRM (${briefing.ferramentas || "CRM"})
### 10. Métricas e Metas do Funil
Para atingir ${briefing.metaFaturamento} com ticket de ${briefing.ticketMedio}, calcule exatamente quantos leads, reuniões e propostas são necessários por mês.`,

    midia: `${instrucaoGeral}
Crie o documento "Plano de Mídia de Alta Performance — ${empresa}".

Este documento deve ser tão detalhado que um gestor de tráfego possa configurar todas as campanhas do zero sem precisar perguntar nada.

# Plano de Mídia de Alta Performance
## ${empresa} | ${plataformas} | ${regiao}

### Introdução: Estratégia Geral de Mídia
Contextualize: ${briefing.jaInvesteAnuncios === "sim" ? `já investe — resultados: ${briefing.resultadosAtuais || "não informado"}` : "ainda não investe em mídia paga"}, objetivo: ${briefing.objetivoCampanha || "geração de leads qualificados"}, investimento de ${briefing.investimentoMidia || briefing.orcamentoAnuncios || "a definir"}/mês.

### 1. Distribuição de Orçamento
### 2. Estrutura de Campanhas — Detalhamento Completo
#### Campanha 1: Geração de Leads (Topo)
- Segmentação detalhada para ${regiao}, nicho ${briefing.nichoAtuacao}
- Copy Principal: 3 variações
- Meta de CPL

#### Campanha 2: Retargeting (Meio)
#### Campanha 3: Lookalike
#### Campanha 4: Campanhas Sazonais

### 3. Estrutura de Anúncios por Formato (Vídeo, Imagem, Lead Ads)
### 4. Segmentação de Públicos — Mapa Completo
### 5. Calendário de Lançamento (30 Dias)
### 6. KPIs, Metas e Benchmarks para ${briefing.nichoAtuacao}
### 7. Regras de Otimização
### 8. Configurações Técnicas (Pixel, UTMs, CRM)
### 9. Relatório Semanal — Template`,

    criativos: `${instrucaoGeral}
Crie o documento "Criativos e Copies Prontos — ${empresa}".

Este documento deve conter todos os roteiros e copies prontos para produção imediata.

# Criativos e Copies Prontos para Produção
## ${empresa} | Tom: ${briefing.tomDeVoz}

### Introdução: Estratégia Criativa
Conceito central, pilares de comunicação, como os diferenciais (${(briefing.diferenciais||[]).filter(Boolean).join(", ")}) serão comunicados, cores (${briefing.coresMarca || "da marca"}).

### 1. Roteiro de Vídeo 1 — O Problema (30s)
Tema: ${dor1}. Roteiro cena a cena: [0-3s] HOOK, [3-10s] PROBLEMA, [10-20s] AGITAÇÃO, [20-27s] SOLUÇÃO com ${briefing.nomeProduto}, [27-30s] CTA.

### 2. Roteiro de Vídeo 2 — Prova Social (30s)
Usando "${briefing.provaSocial || "depoimento de cliente"}"

### 3. Roteiro de Vídeo 3 — Autoridade (60s)
### 4. Roteiro de Vídeo 4 — Oferta Direta (15s)
${briefing.nomeProduto} por ${briefing.precoProduto}

### 5. Copies para Feed (5 copies completas)
Cada uma com headline, texto, CTA, hashtags para ${briefing.nichoAtuacao} em ${regiao}.
Ângulos: Dor (${dor1}), Desejo (${desejo1}), Prova Social, Autoridade, Oferta.

### 6. Copies para Stories e Reels (5 copies)
### 7. Headlines para Testes A/B (20 headlines)
### 8. Copies para WhatsApp / Mensagens Diretas
### 9. Briefing Visual para Designer
Paleta: ${briefing.coresMarca || "definir"}, tom: ${briefing.tomDeVoz}`,

    playbook: `${instrucaoGeral}
Crie o documento "Playbook Comercial Definitivo — ${empresa}".

Este é o manual sagrado da equipe de vendas.

# Playbook Comercial Definitivo
## ${empresa} | Equipe: ${briefing.equipeVendas}

### 1. Perfil do Vendedor Ideal de ${empresa}
### 2. Conhecimento Obrigatório do Produto
${briefing.nomeProduto} por ${briefing.precoProduto}, garantia: ${briefing.garantia}, diferenciais vs ${concorrentesNomes}

### 3. Rotina Diária do Vendedor (horário a horário)
### 4. Processo Comercial Passo a Passo (7 etapas)
Com scripts exatos para cada etapa via ${canais}. Qualificação B.A.N.T. para "${briefing.perfilClienteIdeal}".

### 5. Cadência de Follow-up Completa (30 Dias)
Lead quente, morno e frio — mensagens exatas.

### 6. Gestão do CRM (${briefing.ferramentas || "CRM"})
### 7. As 10 Regras de Ouro da Equipe
### 8. Metas, Métricas e Comissionamento
Baseado em ${briefing.metaFaturamento} e ticket de ${briefing.ticketMedio}.

### 9. Reuniões de Pipeline
### 10. Onboarding de Novos Vendedores (4 semanas)`,

    script: `${instrucaoGeral}
Crie o documento "Scripts de Vendas Completos — ${empresa}".

ATENÇÃO: Escreva as falas EXATAS, não resumos. O vendedor deve poder ler em voz alta.

# Scripts de Vendas Completos
## ${empresa} | Tom: ${briefing.tomDeVoz} | Canais: ${canais}

### PARTE 1: Scripts de WhatsApp / Mensagens
#### 1.1. Abordagem Inicial — Lead Inbound (SLA: 5 min)
#### 1.2. Qualificação via ${canais} (4 perguntas + cenários)
#### 1.3. Agendamento da Reunião
#### 1.4. Follow-up (7 variações: Dia 1, 3, 7, 14, 21, reativação, perdido para concorrente)

### PARTE 2: Script da Reunião de Diagnóstico (45-60 min)
Objetivo: Fechar ${briefing.nomeProduto} por ${briefing.precoProduto}
#### Fase 1: Abertura e Rapport (0-5 min)
#### Fase 2: Investigação — Situação (5-15 min)
#### Fase 3: Investigação — Problema (15-25 min) — dores: ${dor1}, ${dor2}
#### Fase 4: Implicação (25-30 min)
#### Fase 5: Apresentação da Solução (30-40 min)
Garantia: ${briefing.garantia}, prova social: ${briefing.provaSocial || "cases"}
#### Fase 6: Fechamento (40-50 min)

### PARTE 3: Scripts por Canal (Telefone, Presencial)
### PARTE 4: Scripts de Situações Especiais
Concorrência (${concorrentesNomes}), reativação, indicação, upsell.`,

    objecoes: `${instrucaoGeral}
Crie o documento "Tabela de Objeções Definitiva — ${empresa}".

ATENÇÃO: Scripts COMPLETOS de reversão, não resumos. Mínimo de 50 objeções.

# Tabela de Objeções Definitiva
## ${empresa} | Método A.I.R. | ${briefing.nichoAtuacao}

### Introdução: O Método A.I.R.
A — Amortecer, I — Isolar, R — Reverter. Com exemplos para ${briefing.nichoAtuacao}.

### Regras de Ouro (10 regras)

## CATEGORIA 1: OBJEÇÕES DE PREÇO (10+)
Produto: ${briefing.nomeProduto} por ${briefing.precoProduto}
Para cada: Objeção | Dor Oculta | Amortecer | Isolar | Reverter | Prova (${briefing.provaSocial || "cases"})
Incluir: "Está caro", "Não tenho dinheiro", "Consigo mais barato com ${concorrentesNomes.split(",")[0] || "concorrente"}", etc.

## CATEGORIA 2: CONFIANÇA E CREDIBILIDADE (8+)
## CATEGORIA 3: TEMPO E URGÊNCIA (8+)
## CATEGORIA 4: TERCEIROS — SÓCIOS, CÔNJUGE (8+)
## CATEGORIA 5: CONCORRÊNCIA (${concorrentesNomes}) (6+)
## CATEGORIA 6: SOBRE O PRODUTO ${briefing.nomeProduto} (8+)
Garantia: ${briefing.garantia}

## OBJEÇÕES ESPECÍFICAS DO CLIENTE
Para cada objeção informada: ${(briefing.objecoes||[]).filter(Boolean).join(", ")}

## Técnicas Avançadas de Reversão
1. O Espelho, 2. Ancoragem de Valor (${briefing.precoProduto}), 3. Custo da Inação, 4. Prova Social Cirúrgica, 5. Fechamento Condicional

## O que NUNCA Fazer (10 erros fatais)`,

    landing_page: `${instrucaoGeral}
Crie o documento "Conteúdo Completo para Landing Page de Alta Conversão — ${empresa}".

Este documento deve conter TODO o conteúdo textual pronto para ser implementado em uma landing page de alta conversão. Cada seção (dobra) deve ter textos finais, prontos para copiar e colar. O desenvolvedor/designer deve conseguir montar a página inteira apenas com este documento.

# Landing Page de Alta Conversão
## ${empresa} | ${briefing.nomeProduto} | ${briefing.nichoAtuacao}

### DOBRA 1 — HERO (Acima da Dobra)
- **Headline Principal** (máx. 10 palavras, impactante, focada no resultado/desejo "${desejo1}")
- **Sub-headline** (1-2 frases complementando a headline, mencionando a transformação)
- **CTA Principal** (texto exato do botão, ex: "Quero Minha Vaga", "Agendar Diagnóstico Gratuito")
- **CTA Secundário** (texto menor abaixo do botão, ex: "Sem compromisso • Resultado em 7 dias")
- **Prova Social Rápida** (ex: "+500 clientes atendidos", "${briefing.provaSocial || 'resultados comprovados'}")
- **Elemento de Urgência** (ex: "Últimas vagas para ${regiao}")

### DOBRA 2 — PROBLEMA / DOR
- **Título da Seção** (ex: "Você se identifica com isso?")
- **Lista de Dores** (5-7 bullets baseados em: ${(briefing.doresPublico||[]).filter(Boolean).join(", ")})
- **Parágrafo de Agitação** (amplificar a dor, mostrar o custo de não resolver)
- **Frase de Transição** (conectar o problema à solução)

### DOBRA 3 — SOLUÇÃO / APRESENTAÇÃO DO PRODUTO
- **Título** (ex: "Conheça o ${briefing.nomeProduto}")
- **Descrição** (2-3 parágrafos explicando o que é e como funciona)
- **Lista de Benefícios** (6-8 benefícios com ícone sugerido + texto)
- **Diferencial Principal** vs concorrentes (${concorrentesNomes})

### DOBRA 4 — COMO FUNCIONA (Passo a Passo)
- **Título** (ex: "Como Funciona em 3 Passos Simples")
- **Passo 1**: Título + Descrição (1-2 frases)
- **Passo 2**: Título + Descrição
- **Passo 3**: Título + Descrição
- **CTA Intermediário**

### DOBRA 5 — PROVA SOCIAL / DEPOIMENTOS
- **Título** (ex: "Veja o que nossos clientes dizem")
- **Depoimento 1**: Nome fictício realista, cargo/empresa, texto de 2-3 frases focado em resultado
- **Depoimento 2**: Diferente ângulo (facilidade, suporte, ROI)
- **Depoimento 3**: Diferente ângulo (transformação, antes/depois)
- **Números de Impacto** (ex: "98% de satisfação", "+${briefing.tempoMercado} no mercado")

### DOBRA 6 — BENEFÍCIOS DETALHADOS / ENTREGÁVEIS
- **Título** (ex: "Tudo que você recebe")
- **Lista de Entregáveis** (8-12 itens com título + descrição curta de cada)
- Inclua os diferenciais reais: ${(briefing.diferenciais||[]).filter(Boolean).join(", ")}

### DOBRA 7 — AUTORIDADE / SOBRE A EMPRESA
- **Título** (ex: "Por que a ${empresa}?")
- **Texto institucional** (2-3 parágrafos: história, missão, experiência no nicho ${briefing.nichoAtuacao})
- **Números de Autoridade** (tempo de mercado: ${briefing.tempoMercado}, região: ${regiao}, etc.)
- **Selos / Certificações** (sugestões de elementos visuais de confiança)

### DOBRA 8 — OFERTA E PREÇO
- **Título** (ex: "Investimento")
- **Preço**: ${briefing.precoProduto}
- **Ancoragem de Valor** (mostrar valor total vs preço real)
- **Garantia**: ${briefing.garantia}
- **Condições de Pagamento** (sugestões: parcelamento, desconto à vista)
- **CTA Principal** com urgência
- **Elemento de Escassez** (vagas limitadas, bônus por tempo limitado)

### DOBRA 9 — FAQ (Perguntas Frequentes)
Crie 8-10 perguntas e respostas baseadas nas objeções reais: ${(briefing.objecoes||[]).filter(Boolean).join(", ")}
Cada resposta deve reverter a objeção e reforçar o valor.

### DOBRA 10 — CTA FINAL / FECHAMENTO
- **Título de Urgência** (ex: "Não deixe para depois")
- **Parágrafo Final** (resumo emocional da transformação)
- **CTA Final** (mesmo botão do hero, com urgência reforçada)
- **Informações de Contato** (canais: ${(briefing.canaisAtendimento || []).filter(Boolean).join(", ") || "WhatsApp"})
- **Texto Legal** (direitos reservados, CNPJ, etc.)

### DOBRA EXTRA — BÔNUS (Opcional)
- **Título** (ex: "Bônus Exclusivos por Tempo Limitado")
- Crie 3 bônus relevantes para o nicho ${briefing.nichoAtuacao} com valor percebido alto

### NOTAS PARA O DESENVOLVEDOR
- Cores sugeridas: ${briefing.coresMarca || "definir com o cliente"}
- Tom de voz: ${briefing.tomDeVoz}
- Plataformas de anúncio que direcionarão tráfego: ${plataformas}
- Sugestão de ferramentas de captura: formulário com nome, email, telefone
- Mobile-first: todas as dobras devem funcionar em telas pequenas`,

    followup: `${instrucaoGeral}
Crie o documento "Cadência Completa de Mensagens Follow-up — ${empresa}".

Este documento deve ser o manual definitivo de follow-up. O vendedor deve poder copiar e colar cada mensagem sem precisar pensar. Cada mensagem deve ser EXATA, pronta para enviar.

# Cadência Completa de Mensagens Follow-up
## ${empresa} | ${canais} | Tom: ${briefing.tomDeVoz}

### Introdução: A Importância do Follow-up
Contextualize com dados: 80% das vendas acontecem entre o 5º e 12º contato. Explique a estratégia de cadência para ${briefing.nichoAtuacao}.

### FASE 1: LEAD QUENTE (Acabou de Demonstrar Interesse)
#### Dia 0 — Resposta Imediata (SLA: 5 minutos)
- Mensagem via ${canais}: texto exato, personalizado para quem busca ${briefing.nomeProduto}
- Variação A (tom direto)
- Variação B (tom consultivo)

#### Dia 0 — 2ª Mensagem (2 horas depois, se não respondeu)
- Texto exato com gatilho de curiosidade

#### Dia 1 — Manhã
- Mensagem com prova social (${briefing.provaSocial || "case de sucesso"})

#### Dia 1 — Tarde (se não respondeu)
- Áudio sugerido (roteiro exato do que falar em 30 segundos)

#### Dia 2
- Mensagem com conteúdo de valor (dica rápida sobre ${dor1})

#### Dia 3
- Mensagem de escassez/urgência

#### Dia 5
- Última tentativa direta + pergunta aberta

### FASE 2: LEAD MORNO (Respondeu mas não agendou/comprou)
#### Dia 1 após último contato
- Retomada suave

#### Dia 3
- Envio de material de valor (link para conteúdo sobre ${briefing.nichoAtuacao})

#### Dia 7
- Case de sucesso detalhado (antes/depois de cliente similar)

#### Dia 10
- Mensagem "thinking of you" — novidade ou insight do mercado

#### Dia 14
- Oferta especial ou bônus por tempo limitado

#### Dia 21
- Mensagem de despedida elegante (gatilho de perda)

### FASE 3: LEAD FRIO (Não respondeu nenhuma mensagem)
#### Semana 1
- Tentativa por canal diferente (se tem email, ligar; se tem WhatsApp, email)

#### Semana 2
- Conteúdo educativo sem pedir nada

#### Semana 3
- Pesquisa rápida ("O que te impede de...")

#### Mês 2
- Reativação com novidade ou mudança de oferta

#### Mês 3
- Última tentativa + link para conteúdo evergreen

### FASE 4: PÓS-REUNIÃO (Fez reunião mas não fechou)
#### Mesmo dia (até 2h após reunião)
- Resumo da reunião + próximos passos + ${briefing.precoProduto}

#### Dia 1
- Material complementar (proposta formal, apresentação)

#### Dia 2
- Pergunta sobre dúvidas + reforço de garantia (${briefing.garantia})

#### Dia 3
- Depoimento de cliente em situação similar

#### Dia 5
- Urgência: vaga/condição especial expirando

#### Dia 7
- Check-in final + facilidade de pagamento

#### Dia 10
- Mensagem de "porta aberta" para retomada futura

### FASE 5: PÓS-VENDA (Cliente fechou)
#### Dia 0 — Boas-vindas
- Mensagem de onboarding

#### Dia 3
- Check-in: está tudo certo?

#### Dia 7
- Pedido de feedback rápido

#### Dia 15
- Conteúdo exclusivo para clientes

#### Dia 30
- Pedido de depoimento/avaliação

#### Dia 45
- Oferta de upsell/cross-sell

#### Dia 60
- Programa de indicação

### FASE 6: REATIVAÇÃO DE CLIENTES INATIVOS
#### Mensagem 1 — Saudade
#### Mensagem 2 — Novidade (7 dias depois)
#### Mensagem 3 — Oferta especial (14 dias depois)
#### Mensagem 4 — Última chance (21 dias depois)

### FASE 7: PERDIDO PARA CONCORRENTE (${concorrentesNomes})
#### Mensagem 1 — Aceitação elegante (mesmo dia)
#### Mensagem 2 — 30 dias depois (check-in)
#### Mensagem 3 — 60 dias depois (oferta de migração)

### TEMPLATES DE ÁUDIO (Roteiros para gravar)
- Áudio 1: Apresentação inicial (20s)
- Áudio 2: Follow-up de valor (15s)
- Áudio 3: Urgência (10s)
- Áudio 4: Pós-reunião (25s)

### REGRAS DE OURO DO FOLLOW-UP
1. Nunca enviar mais de 2 mensagens por dia
2. Variar entre texto, áudio e conteúdo
3. Sempre personalizar com o nome do lead
4. Respeitar horário comercial (8h-20h)
5. Se o lead pedir para parar, parar imediatamente
6. Registrar cada interação no CRM (${briefing.ferramentas || "CRM"})
7. Medir taxa de resposta por fase e ajustar

### MÉTRICAS DE FOLLOW-UP
Tabela: Fase | Mensagens | Taxa de Resposta Esperada | Conversão Esperada | Ação se Abaixo da Meta

### CONFIGURAÇÃO NO CRM
Como configurar automações de follow-up no ${briefing.ferramentas || "CRM"} para ${empresa}.`,

    calendario_editorial: `${instrucaoGeral}
Crie o documento "Calendário Editorial de Conteúdo — 30 Dias — ${empresa}".

Este documento deve ser um calendário completo de 30 dias com posts prontos para redes sociais. O social media deve poder copiar e publicar sem precisar de mais nada.

# Calendário Editorial de Conteúdo — 30 Dias
## ${empresa} | ${briefing.nichoAtuacao} | Tom: ${briefing.tomDeVoz}

### Estratégia Editorial
- **Objetivo**: ${briefing.objetivoCampanha || "Gerar autoridade e leads qualificados"}
- **Público-alvo**: ${briefing.perfilClienteIdeal}
- **Plataformas**: Instagram, ${(briefing.plataformasAnuncio || []).filter(Boolean).join(", ") || "redes sociais"}
- **Frequência**: 1 post/dia (mínimo)
- **Pilares de Conteúdo**:
  1. **Educativo** (40%) — Ensinar sobre ${briefing.nichoAtuacao}, resolver dores (${(briefing.doresPublico||[]).filter(Boolean).join(", ")})
  2. **Autoridade** (25%) — Cases, bastidores, provas sociais (${briefing.provaSocial || "resultados"})
  3. **Engajamento** (20%) — Enquetes, perguntas, trends, humor
  4. **Venda Direta** (15%) — Ofertas, ${briefing.nomeProduto}, depoimentos

### Identidade Visual
- Cores: ${briefing.coresMarca || "da marca"}
- Tom de voz: ${briefing.tomDeVoz}
- Hashtags fixas: crie 10 hashtags de marca + 10 de nicho para ${briefing.nichoAtuacao} em ${regiao}

---

## SEMANA 1 — Posicionamento e Autoridade

### Dia 1 (Segunda) — Carrossel Educativo
- **Formato**: Carrossel (8-10 slides)
- **Tema**: "${dor1}" — Como resolver
- **Slide 1 (Capa)**: Headline impactante (texto exato)
- **Slides 2-8**: Conteúdo passo a passo (texto exato de cada slide)
- **Slide Final**: CTA + contato
- **Legenda**: Texto completo com emojis, quebras de linha, hashtags
- **Horário**: 10h

### Dia 2 (Terça) — Reels / Vídeo Curto
- **Formato**: Reels (15-30s)
- **Roteiro**: Hook (3s) + Conteúdo (20s) + CTA (5s) — texto exato
- **Legenda**: Texto completo
- **Horário**: 12h

### Dia 3 (Quarta) — Post Estático de Prova Social
- **Formato**: Imagem única
- **Conteúdo**: Depoimento/resultado de cliente
- **Texto da arte**: Exato
- **Legenda**: Texto completo com storytelling
- **Horário**: 18h

### Dia 4 (Quinta) — Stories Interativos (5 stories)
- **Story 1**: Enquete sobre ${dor1}
- **Story 2**: Caixinha de perguntas
- **Story 3**: Bastidores
- **Story 4**: Dica rápida
- **Story 5**: CTA para ${briefing.nomeProduto}
- Texto exato de cada story

### Dia 5 (Sexta) — Post de Engajamento
- **Formato**: Imagem com pergunta
- **Texto da arte**: Pergunta provocativa sobre ${briefing.nichoAtuacao}
- **Legenda**: Texto completo estimulando comentários
- **Horário**: 11h

### Dia 6 (Sábado) — Carrossel de Venda
- **Formato**: Carrossel (6-8 slides)
- **Tema**: Apresentação de ${briefing.nomeProduto} por ${briefing.precoProduto}
- Texto exato de cada slide + legenda completa
- **Horário**: 10h

### Dia 7 (Domingo) — Reels Inspiracional/Bastidores
- **Formato**: Reels (30-60s)
- **Roteiro**: Texto exato — história da ${empresa}, missão, por que fazemos
- **Legenda**: Texto completo
- **Horário**: 19h

---

## SEMANA 2 — Educação e Engajamento

### Dia 8 a Dia 14
Para cada dia, forneça:
- Formato (Carrossel, Reels, Estático, Stories)
- Tema específico relacionado a: diferenciais (${(briefing.diferenciais||[]).filter(Boolean).join(", ")}), dores e desejos do público
- Texto completo da arte
- Legenda completa com hashtags
- Horário sugerido
- Dia 8: Mitos sobre ${briefing.nichoAtuacao} (Carrossel)
- Dia 9: Antes e Depois de cliente (Reels)
- Dia 10: Dica prática rápida (Post estático)
- Dia 11: Caixinha de perguntas + respostas (Stories)
- Dia 12: Comparativo ${empresa} vs concorrência (Carrossel)
- Dia 13: Oferta/Promoção relâmpago (Post + Stories)
- Dia 14: Conteúdo lifestyle/bastidores (Reels)

---

## SEMANA 3 — Conversão e Prova Social

### Dia 15 a Dia 21
- Dia 15: Case de sucesso detalhado (Carrossel)
- Dia 16: FAQ — Respondendo objeções: ${(briefing.objecoes||[]).filter(Boolean).slice(0,3).join(", ")} (Reels)
- Dia 17: Depoimento em vídeo / print (Post)
- Dia 18: Conteúdo colaborativo / trend (Reels)
- Dia 19: Garantia ${briefing.garantia} explicada (Carrossel)
- Dia 20: Urgência/Escassez — vagas limitadas (Post + Stories)
- Dia 21: Recap da semana + CTA forte (Reels)

---

## SEMANA 4 — Fechamento e Autoridade

### Dia 22 a Dia 28
- Dia 22: Os ${(briefing.diferenciais||[]).length || 5} diferenciais de ${empresa} (Carrossel)
- Dia 23: Rotina/dia a dia da equipe (Reels bastidores)
- Dia 24: Erro comum no nicho ${briefing.nichoAtuacao} (Post educativo)
- Dia 25: Live / Q&A anunciada nos stories (Stories + Post)
- Dia 26: Resultado de cliente com números (Post)
- Dia 27: Oferta especial de fim de mês (Carrossel de venda)
- Dia 28: Reels emocional — transformação do cliente (Reels)

### Dia 29 e 30 — Bônus
- Dia 29: Retrospectiva do mês + resultados alcançados (Carrossel)
- Dia 30: Teaser do próximo mês + CTA de antecipação (Reels + Stories)

---

### BANCO DE LEGENDAS EXTRAS
Crie 10 legendas extras genéricas adaptáveis para ${briefing.nichoAtuacao} que podem ser usadas em qualquer dia.

### BANCO DE HASHTAGS
- 15 hashtags de nicho para ${briefing.nichoAtuacao}
- 10 hashtags de localização para ${regiao}
- 5 hashtags de marca para ${empresa}

### CALENDÁRIO RESUMO (Tabela)
Tabela: Dia | Formato | Pilar | Tema | Horário | Status

### MÉTRICAS PARA ACOMPANHAR
- Alcance, Engajamento, Salvamentos, Compartilhamentos, Cliques no link, DMs recebidas
- Meta semanal sugerida para cada métrica
- Como ajustar a estratégia com base nos resultados`,
  };

  return prompts[docType];
}

// ── Serve ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefingData, docType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!DOC_TYPES.includes(docType)) {
      return new Response(JSON.stringify({ error: `Invalid docType: ${docType}. Valid: ${DOC_TYPES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(docType as DocType, briefingData);

    // Docs complexos usam modelo premium para maior qualidade
    const complexDocs: DocType[] = ["planejamento", "playbook", "funil", "script", "landing_page", "followup"];
    const model = complexDocs.includes(docType as DocType)
      ? "google/gemini-2.5-pro"
      : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 16384,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar documento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
