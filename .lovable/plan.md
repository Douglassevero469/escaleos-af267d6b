# Gestão de Clientes Ativos

Nova área no menu para acompanhar **clientes ativos** (em contrato), os **serviços prestados** a cada um, **fee mensal**, datas de início/renovação e status do contrato. Diferente da aba "Clientes" atual, que é focada em briefings + pacotes gerados.

## Estrutura

### 1. Nova rota e item no menu

- Rota: `/gestao-clientes` (página `src/pages/GestaoClientes.tsx`)
- Novo item no `AppSidebar` chamado **"Gestão de Clientes"** com ícone `Briefcase` (ou `HandCoins`), posicionado logo abaixo de "Clientes".

### 2. Banco de dados (migration)

Como `clients` hoje é só cadastro básico (nome, nicho, instagram, site), criamos duas novas tabelas para o módulo de gestão:

`**client_contracts**` — um contrato ativo por cliente (pode haver histórico)

- `id`, `client_id`, `user_id`
- `status` (`active` | `paused` | `churned`) — default `active`
- `monthly_fee` numeric — fee mensal em R$
- `start_date` date
- `renewal_date` date (nullable)
- `payment_day` integer (1–31, dia de cobrança)
- `responsible` text (responsável interno pela conta)
- `notes` text
- `created_at`, `updated_at`

`**client_services**` — serviços prestados em um contrato (N por contrato)

- `id`, `contract_id`, `user_id`
- `service_type` text (Tráfego Pago, Social Media, Full Service, Consultoria,  Software ,Escale CRM, etc.)
- `description` text
- `scope` text (entregáveis/escopo)
- `active` boolean default true
- `created_at`

RLS: políticas abertas para `authenticated` (padrão do projeto — modelo open workspace).

### 3. Página `GestaoClientes.tsx`

**Header**

- Título "Gestão de Clientes" + contador de ativos
- Botão "Novo Contrato" (abre dialog para escolher cliente existente + preencher dados)

**KPIs (4 cards no topo)**

- Clientes ativos
- MRR total (soma dos `monthly_fee` dos contratos ativos)
- Ticket médio
- Clientes em pausa / churn no mês

**Filtros**

- Busca por nome
- Filtro por status (Ativos / Pausados / Churn / Todos)
- Filtro por serviço prestado

**Listagem (tabela + cards toggle)**
Colunas: Cliente | Serviços (badges) | Fee Mensal | Início | Próx. renovação | Responsável | Status | Ações

**Detalhe / Edição (Sheet lateral ao clicar)**

- Dados do contrato editáveis
- Lista de serviços com adicionar/remover/editar
- Histórico de alterações (futuramente — via `audit_logs`)
- Atalhos: ver pacotes do cliente, abrir CRM, abrir demandas

**Ações em massa rápidas**

- Marcar como Pausado / Churn
- Exportar CSV (lista de clientes ativos + fees)

### 4. Integração com módulos existentes

- Link "Ver Pacotes" → `/clientes/:id/pacotes`
- Dashboard pode futuramente puxar MRR daqui (não nesta entrega)

## Detalhes técnicos

- Tipos: criar `ServiceType` como union de strings sugeridas + livre digitação (input com sugestões).
- React Query para `contracts` e `services` com invalidação cruzada após mutations.
- `monthly_fee` formatado em BRL (`Intl.NumberFormat`).
- Reutilizar `GlassCard`, `Dialog`, `Sheet`, `Table`, `Badge`, `DropdownMenu`.
- Manter padrão visual: glassmorphism, Montserrat, paleta atual.

## Fora do escopo (sugestões futuras)

- Cobranças/faturas automáticas
- Integração com gateway de pagamento
- Forecast de MRR e churn analytics
- Notificações automáticas próximas à renovação

Confirma esse plano? Se quiser ajustar (ex.: campos extras, remover tabela de serviços, usar um único registro por cliente em vez de contratos versionados), me diga antes de eu implementar.