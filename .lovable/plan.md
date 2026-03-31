

# Plano: Construir a Plataforma EscaleOS

## Visao Geral

O EscaleOS e uma plataforma web que transforma briefings em pacotes comerciais completos usando IA. Vou construir o frontend completo com design glassmorphism, animacoes e dados mockados. O backend (Supabase) pode ser conectado depois.

## Fase 1 -- Fundacao e Design System

**Arquivos:** `src/index.css`, `tailwind.config.ts`

- Paleta de cores escura premium (tons de azul marinho, roxo e gradientes)
- CSS variables para glassmorphism (blur, transparencia, bordas sutis)
- Tipografia com Inter/font moderna
- Animacoes com keyframes (fade-in, slide-up, glow)

## Fase 2 -- Layout e Navegacao

**Arquivos novos:** `src/components/Layout/Sidebar.tsx`, `src/components/Layout/AppLayout.tsx`, `src/components/Layout/Header.tsx`

- Sidebar com navegacao: Dashboard, Novo Briefing, Clientes, Templates, Admin
- Header com busca, notificacoes e avatar do usuario
- Layout responsivo mobile-first

## Fase 3 -- Paginas Principais

### 3.1 Landing Page (`src/pages/Index.tsx`)
- Hero com headline "Briefing entra, pacote completo sai"
- Secoes: problema, solucao, documentos gerados, stack, CTA
- Animacoes de entrada

### 3.2 Login/Registro (`src/pages/Login.tsx`)
- Formulario com email/senha e opcao OAuth
- Design glassmorphism com fundo gradiente

### 3.3 Dashboard (`src/pages/Dashboard.tsx`)
- Cards de metricas: total clientes, pacotes gerados, documentos, templates
- Grafico de pacotes por mes (recharts)
- Lista de pacotes recentes
- Atividade recente

### 3.4 Formulario de Briefing Multi-Step (`src/pages/NovoBriefing.tsx`)
- 7 etapas com progress bar visual:
  1. Identidade (nome, nicho, Instagram, site, tempo de mercado)
  2. Financeiro (faturamento, meta, ticket medio, orcamento ads)
  3. Produto e Publico (produto, preco, perfil ideal, dores, desejos)
  4. Concorrentes (ate 3, com pontos fortes/fracos, preco, site)
  5. Operacional (equipe, ferramentas, gargalo, objecoes, tom de voz)
  6. Midia e Marca (plataformas, investimento, cores, prova social)
  7. Revisao e Confirmacao
- Opcao de upload de arquivo (YAML, JSON, PDF, DOCX)

### 3.5 Clientes e Historico (`src/pages/Clientes.tsx`)
- Lista de clientes com busca por nome/nicho
- Cada cliente mostra seus pacotes gerados

### 3.6 Pacote de Documentos (`src/pages/PacoteDocumentos.tsx`)
- Grid com os 8 documentos do pacote
- Preview em Markdown renderizado
- Download individual ou ZIP
- Status de geracao (gerando, pronto, erro)

### 3.7 Templates (`src/pages/Templates.tsx`)
- Grid de templates salvos com nome, descricao e contador de usos
- Criar template a partir de pacote existente
- Aplicar template a novo cliente

### 3.8 Painel Admin (`src/pages/Admin.tsx`)
- Visao global de usuarios e pacotes
- Tabela com filtros e busca

## Fase 4 -- Componentes Compartilhados

- `StatsCard` -- card de metrica com icone e variacao
- `DocumentCard` -- card de documento com preview e download
- `ClientCard` -- card de cliente com info resumida
- `TemplateCard` -- card de template com contador
- `StepIndicator` -- indicador de progresso multi-step
- `GlassCard` -- card com efeito glassmorphism reutilizavel

## Fase 5 -- Rotas

Atualizar `App.tsx` com todas as rotas:
- `/` -- Landing page
- `/login` -- Login/Registro
- `/dashboard` -- Dashboard
- `/briefing/novo` -- Novo briefing
- `/clientes` -- Lista de clientes
- `/clientes/:id/pacotes` -- Pacotes do cliente
- `/pacote/:id` -- Documentos do pacote
- `/templates` -- Templates
- `/admin` -- Painel admin

## Detalhes Tecnicos

- **Stack**: React + TypeScript + Tailwind CSS (ja configurado)
- **Graficos**: recharts (sera adicionado)
- **Markdown**: react-markdown para preview de documentos
- **Animacoes**: CSS animations + Tailwind animate
- **Dados**: Todos mockados com arrays estaticos para demonstracao
- **Design**: Glassmorphism com fundo escuro gradiente, blur, bordas semi-transparentes

## Ordem de Implementacao

Vou comecar pela fundacao (design system + layout) e ir construindo as paginas uma por uma, comecando pela landing page e dashboard. O formulario de briefing multi-step sera a peca mais complexa. Cada iteracao entrega valor visual imediato.

