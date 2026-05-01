
# Módulo Financeiro — Estrutura Completa

Nova aba **Financeiro** (`/financeiro`) para gerir entradas (clientes/MRR), saídas (folha, prolabores, custos fixos, despesas variáveis) e oferecer um **dashboard BI** completo com forecasts e indicadores de saúde da empresa.

A estrutura segue o que foi mapeado no recorte enviado:
- **Entradas**: clientes recorrentes (Leo Bortolin, Sec. Bruno, Toto, Besouro... = R$41k)
- **Saídas**: Folha (R$23.5k), Prolabores (R$45k), Sistemas (R$10k), Contador, Sala, etc. = R$81.9k
- **Equipe**: hierarquia (Fill, Jef, Douglas → Fin/Adm, Closer, Tráfego, Arte, Vídeo, Devs) com salário individual
- **Saldo do mês** com alertas visuais (vermelho quando negativo)

## Estrutura de Navegação

Nova entrada no `AppSidebar` chamada **"Financeiro"** com ícone `DollarSign` (ou `Wallet`), abaixo de "Gestão de Clientes".

A página `/financeiro` terá **5 abas internas** (Tabs):

1. **Dashboard BI** — KPIs, gráficos e visão executiva
2. **Receitas** — Entradas recorrentes e avulsas
3. **Despesas** — Saídas categorizadas
4. **Equipe & Folha** — Organograma + salários/prolabores
5. **Fluxo de Caixa** — Visão mensal/anual com projeções

## Banco de Dados (migration)

### `finance_categories`
Categorias de receita/despesa configuráveis.
- `id`, `user_id`, `name`, `kind` ('income'|'expense'), `color`, `icon`, `created_at`

### `finance_team_members`
Membros da equipe com hierarquia e custo mensal.
- `id`, `user_id`, `name`, `role` (cargo), `manager_id` (self-fk para hierarquia: Fill/Jef/Douglas como gerentes), `compensation_type` ('salary'|'prolabore'|'contractor'), `monthly_cost` numeric, `status` ('active'|'inactive'|'vacant'), `start_date`, `notes`

### `finance_recurring_revenues`
Receitas recorrentes (clientes ativos que pagam mensalmente).
- `id`, `user_id`, `client_name`, `description`, `amount` numeric, `payment_day` int, `status` ('active'|'paused'|'churned'), `start_date`, `end_date` nullable, `linked_contract_id` (opcional → `client_contracts.id`), `category_id`
- *Atalho*: botão "Importar de Gestão de Clientes" para puxar contratos ativos automaticamente.

### `finance_recurring_expenses`
Despesas fixas mensais (Sistemas, Sala, Contador, etc.).
- `id`, `user_id`, `name`, `description`, `amount` numeric, `payment_day` int, `category_id`, `vendor` text, `active` boolean, `start_date`, `end_date` nullable

### `finance_transactions`
Lançamentos efetivos (entradas e saídas confirmadas/previstas) — base para o fluxo de caixa real.
- `id`, `user_id`, `kind` ('income'|'expense'), `category_id`, `description`, `amount` numeric, `due_date` date, `paid_date` date nullable, `status` ('pending'|'paid'|'overdue'|'canceled'), `payment_method` text, `reference_type` text ('manual'|'recurring_revenue'|'recurring_expense'|'team_payroll'), `reference_id` uuid, `attachment_url` text, `notes` text, `created_at`, `updated_at`

RLS: padrão open workspace (todos `authenticated` com CRUD completo).

### Função SQL `generate_monthly_transactions(month date)`
Gera os lançamentos do mês a partir das tabelas recorrentes (revenues, expenses, team) — botão "Gerar lançamentos do mês" na UI.

## Página `Financeiro.tsx` — detalhamento por aba

### Aba 1 — Dashboard BI

**KPIs (cards no topo)**
- MRR (Receita Recorrente)
- Despesas Fixas Mensais
- Resultado do Mês (verde/vermelho)
- Burn Rate / Runway (meses de caixa restante baseado no saldo médio)
- Ticket Médio por cliente
- Custo por Funcionário

**Gráficos (Recharts)**
- **Linha**: Receita vs Despesa últimos 12 meses
- **Área empilhada**: Composição de despesas por categoria (Folha, Prolabore, Sistemas, etc.)
- **Donut**: Distribuição de receita por cliente (top 10)
- **Barras**: Saldo mensal últimos 6 meses
- **Funnel/Forecast**: Projeção de saldo próximos 3 meses

**Alertas inteligentes**
- "Despesas superam receita em X%"
- "3 clientes representam 60% do MRR (concentração de risco)"
- "R$X em contas vencendo nos próximos 7 dias"

### Aba 2 — Receitas

- Tabela de receitas recorrentes (cliente, valor, dia pgto, status, ações)
- Botão "Nova Receita" + "Importar de Gestão de Clientes"
- Filtros: status, mês, categoria
- Total MRR consolidado no topo
- Sheet lateral para edição

### Aba 3 — Despesas

- Tabela de despesas recorrentes agrupadas por categoria
- Possibilidade de marcar como "ativa/inativa"
- Categoria de despesas pré-cadastradas: Folha, Prolabores, Sistemas, Contador, Sala, Marketing, Impostos, Outros
- Botão "Nova Despesa Fixa" e "Lançamento Avulso"

### Aba 4 — Equipe & Folha

**Visualização em 2 modos (toggle)**:

1. **Organograma** (estilo do recorte enviado) — usando `react-flow` ou um grid customizado com cards conectados por linhas. Top: 3 sócios (Fill, Jef, Douglas). Sob cada sócio: cargos sob sua gestão. Cards em **amarelo** para vagas preenchidas, **rosa** para vagas em aberto (`?`).

2. **Tabela** — Nome, Cargo, Gestor, Tipo (Salário/Prolabore/PJ), Custo Mensal, Status, Ações.

**KPIs**
- Total de Folha (somatório de salários)
- Total de Prolabores
- Custo Total da Equipe
- Vagas em aberto

**Botão**: "Nova Posição" — permite cadastrar mesmo sem pessoa atribuída (vaga em aberto).

### Aba 5 — Fluxo de Caixa

- Tabela mensal com colunas: Mês | Receita | Despesa | Saldo | Saldo Acumulado
- Visão de 12 meses (passado e projeção)
- Drill-down: clicar em um mês abre todos os lançamentos daquele mês
- Lançamentos pendentes destacados (amarelo) e vencidos (vermelho)
- Exportação CSV / PDF do fluxo

## Padrões Visuais e Técnicos

- **Glassmorphism + Montserrat** (memória do projeto)
- **Recharts** para gráficos, com cores da paleta (Roxo #7B2FF7, Azul #0000FF)
- **GlassCard, StatsCard, Sheet, Dialog, Table, Badge, Tabs** já existentes
- Formatação BRL via `Intl.NumberFormat('pt-BR')`
- React Query com invalidação cruzada entre tabelas
- Para o organograma: cards em grid CSS conectados por SVG linhas (sem dependência nova) — mantém leveza

## Integrações com módulos existentes

- **Gestão de Clientes** → botão para importar contratos ativos como receitas recorrentes
- **Dashboard principal** → futuramente puxar MRR e Saldo do módulo financeiro

## Fora do escopo (futuro)

- Conciliação bancária via Open Finance
- Geração de boletos/NFe
- Múltiplas contas bancárias
- Centro de custos por projeto
- Notificações automáticas de vencimento

---

**Confirma esse plano?** Se quiser ajustar algo (ex: começar só com Dashboard + Receitas + Despesas e deixar Equipe/Fluxo para depois, ou trocar o organograma por uma visão só de tabela), me avise antes.
