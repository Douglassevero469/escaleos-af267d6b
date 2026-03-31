# Plano: Construtor de Formulários (Forms Builder)

## Visao Geral

Criar uma nova seção "Forms" no EscaleOS — um construtor drag-and-drop moderno para criar formulários de captura de leads, com múltiplos layouts (lista, cartão, corrido) e componentes variados. Os formulários criados ficam salvos no banco e podem ser compartilhados via link público.

## 1. Banco de Dados

Criar duas tabelas:

- `**forms**` — armazena cada formulário criado
  - `id`, `user_id`, `name`, `description`, `layout` (list/card/inline/stepper), `fields` (JSONB com array de campos), `settings` (JSONB: cores, logo, redirect URL, mensagem de sucesso), `status` (draft/published), `slug` (único, para link público), `created_at`, `updated_at`
  - RLS: usuário vê/edita apenas os próprios
- `**form_submissions**` — armazena respostas dos leads
  - `id`, `form_id`, `data` (JSONB), `created_at`, `ip_address` (text, nullable)
  - RLS: INSERT público (anon), SELECT apenas pelo dono do form via subquery

## 2. Navegação

- Adicionar item "Forms" no sidebar (`ClipboardList` icon) entre Templates e Admin
- Rota `/forms` (lista) e `/forms/:id` (editor) protegidas
- Rota `/f/:slug` pública (renderização do formulário para leads)

## 3. Página de Listagem (`src/pages/Forms.tsx`)

- Grid de cards com os formulários criados
- Cada card mostra: nome, layout, status (draft/published), contagem de submissions, data
- Ações: editar, duplicar, excluir (com confirmação), copiar link público
- Botão "Novo Formulário" abre modal para nome + layout inicial

## 4. Editor Drag-and-Drop (`src/pages/FormBuilder.tsx`)

**Painel esquerdo — Componentes disponíveis:**

- Texto curto, Texto longo, Email, Telefone, Número
- Select/Dropdown, Checkbox, Radio, Switch, Yes or Not, Selection
- Data, Upload de arquivo
- Título/Heading, Parágrafo (decorativo)
- Divisor, Espaçador

**Area central — Canvas:**

- Drag-and-drop com `@dnd-kit/core` + `@dnd-kit/sortable`
- Preview em tempo real do formulário conforme layout selecionado
- Clique no campo para editar propriedades no painel direito

**Painel direito — Propriedades do campo selecionado:**

- Label, placeholder, required, largura (full/half)
- Opções (para select/radio/checkbox)
- Validações (min/max length, pattern)

**Toolbar superior:**

- Seletor de layout (Lista, Cartão, Corrido, Multi-step)
- Preview mobile/desktop toggle
- Salvar rascunho / Publicar
- Configurações gerais (cores, mensagem de sucesso, redirect)

## 5. Layouts de Formulário

- **Lista** — campos empilhados verticalmente, clássico
- **Cartão** — cada campo ou grupo em um card separado com transição
- **Corrido (Inline)** — campos lado a lado em grid responsivo
- **Multi-step** — wizard com steps e progress bar (reusa StepIndicator)
- **Chatmode** - simulando uma conversação 

## 6. Formulário Público (`src/pages/FormPublic.tsx`)

- Rota `/f/:slug` sem autenticação
- Renderiza o formulário conforme layout e campos salvos
- Submete para `form_submissions` (RLS permite insert anon)
- Tela de sucesso com mensagem customizada

## 7. Visualização de Respostas

- Tab "Respostas" dentro do editor do formulário
- Tabela com todas as submissions, filtro por data
- Opção de visualização kanban ou lista
- Exportar CSV

## Detalhes Técnicos

- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable` (leve, React-native)
- **Campos armazenados como JSONB**: `[{ id, type, label, placeholder, required, options, width, validations }]`
- **Arquivos editados**: `AppSidebar.tsx`, `App.tsx` (rotas), + 4 novos arquivos de página/componente
- **Dependência nova**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Ordem de Implementação

1. Migration (tabelas + RLS)
2. Rota + sidebar
3. Listagem de forms
4. Editor drag-and-drop com canvas e painéis
5. Renderizador público + submissions
6. Visualização de respostas