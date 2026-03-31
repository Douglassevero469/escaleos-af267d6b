

# Plano: CRM — Gestão de Leads conectada aos Formulários

Toda submissão de formulário vira automaticamente um lead no CRM, com funil Kanban, timeline de atividades e qualificação.

---

## Banco de Dados

### Tabela `crm_pipelines`
Funis de venda personalizáveis (como boards de Demandas):
- `id`, `user_id`, `name`, `stages` (jsonb — etapas com id, nome, cor, ordem), `created_at`, `updated_at`
- Stages padrão: "Novo Lead", "Contato Feito", "Qualificado", "Proposta", "Fechado"

### Tabela `crm_leads`
Cada lead = uma submissão convertida:
- `id`, `pipeline_id` (ref crm_pipelines), `user_id`, `form_submission_id` (ref form_submissions, nullable), `form_id` (ref forms, nullable)
- `name`, `email`, `phone`, `company` — extraídos automaticamente dos dados do formulário
- `stage` (id da etapa no pipeline), `position` (ordem no Kanban)
- `score` (integer 0-100, qualificação manual ou BANT)
- `value` (numeric — valor estimado do deal)
- `tags` (jsonb — etiquetas coloridas)
- `notes` (text — notas internas)
- `custom_fields` (jsonb — dados extras do formulário)
- `created_at`, `updated_at`, `lost_at` (timestamp, quando marcado como perdido)

### Tabela `crm_activities`
Timeline cronológica de cada lead:
- `id`, `lead_id` (ref crm_leads), `user_id`
- `type` (note, stage_change, task, call, email, meeting)
- `content` (text), `details` (jsonb — dados extras como de/para estágio)
- `created_at`

### Automação: Trigger no `form_submissions`
- Ao inserir nova submissão, criar automaticamente um lead no pipeline padrão do usuário
- Extrair nome/email/telefone dos campos do formulário (heurística por nome de campo)

---

## Frontend — Estrutura

```text
src/pages/CRM.tsx                    — página principal
src/components/crm/
  PipelineSelector.tsx               — seletor/criador de pipelines
  PipelineSettingsDialog.tsx         — configurar etapas/cores
  KanbanBoard.tsx                    — Kanban drag-and-drop de leads
  KanbanStageColumn.tsx              — coluna por etapa
  LeadCard.tsx                       — card do lead (nome, valor, tags, score)
  LeadDetailSheet.tsx                — sheet lateral com detalhes completos
  LeadTimeline.tsx                   — timeline de atividades do lead
  LeadFilters.tsx                    — filtros (etapa, formulário, tags, score, data)
  ListView.tsx                       — tabela com todos os leads
  NewLeadDialog.tsx                  — criação manual de lead
```

---

## Funcionalidades

### 1. Pipeline Kanban (estilo Kommo/Trello)
- Drag-and-drop entre etapas com @dnd-kit
- Cards mostram: nome, email, valor do deal, score badge, tags, formulário de origem
- Contagem e valor total por etapa
- Ao mover card, registra atividade automática de mudança de etapa

### 2. Detalhe do Lead (Sheet lateral)
- Dados de contato editáveis (nome, email, telefone, empresa)
- Dados originais do formulário (read-only)
- Seletor de etapa, score, valor do deal
- Tags coloridas
- Notas internas
- Timeline cronológica: notas, mudanças de etapa, tarefas

### 3. Conexão automática com Formulários
- Cada nova submissão cria um lead automaticamente via trigger SQL
- Na listagem de leads, badge indica o formulário de origem
- Link direto para ver a submissão original

### 4. Visualização Lista
- Tabela com colunas: nome, email, etapa, score, valor, formulário, data
- Ordenação e busca por nome/email

### 5. Filtros
- Por etapa, formulário de origem, score range, tags, data

---

## Sidebar e Rotas

- Nova entrada "CRM" no sidebar com ícone `Contact` (ou `Users`)
- Rota: `/crm`

---

## Resumo Técnico

| Item | Detalhe |
|---|---|
| Tabelas novas | `crm_pipelines`, `crm_leads`, `crm_activities` |
| Trigger novo | Auto-criar lead ao receber submissão |
| Páginas | 1 página principal com Kanban + Lista |
| Componentes | ~10 componentes novos |
| RLS | Acesso por `user_id` em todas as tabelas |
| Dependência | Reutiliza @dnd-kit já instalado |

