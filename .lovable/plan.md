

# Plano: Aba "Demandas" — Gestão de Tarefas do Time

Sistema completo de gestão de demandas com 3 visualizações (Kanban, Lista e Gantt), inspirado no Notion/Trello/Monday.

---

## Banco de Dados

### Tabela `demand_boards`
Boards/projetos que agrupam demandas:
- `id`, `user_id`, `name`, `description`, `columns` (jsonb — define colunas do Kanban com nome, cor, ordem), `created_at`, `updated_at`

### Tabela `demand_items`
As demandas/tarefas individuais:
- `id`, `board_id` (ref demand_boards), `user_id`, `title`, `description` (texto rico), `status` (coluna do Kanban), `priority` (low/medium/high/urgent), `assignee_name`, `due_date`, `start_date`, `tags` (text[]), `color` (label), `position` (integer — ordem no Kanban), `created_at`, `updated_at`

### Tabela `demand_comments`
Comentários por demanda:
- `id`, `item_id` (ref demand_items), `user_id`, `content`, `created_at`

RLS: usuário só acessa seus boards/itens/comentários.

---

## Frontend — Estrutura de Arquivos

```text
src/pages/Demandas.tsx          — página principal
src/components/demandas/
  BoardSelector.tsx             — seletor/criador de boards
  KanbanView.tsx                — visualização Kanban (drag-and-drop)
  KanbanColumn.tsx              — coluna individual
  KanbanCard.tsx                — card da demanda
  ListView.tsx                  — visualização em tabela
  GanttView.tsx                 — visualização Gantt (timeline)
  DemandDetailSheet.tsx         — sheet lateral com detalhes da demanda
  DemandFilters.tsx             — filtros (prioridade, tags, responsável, data)
  NewDemandDialog.tsx           — modal de criação rápida
  BoardSettingsDialog.tsx       — configurar colunas/cores do board
```

---

## Funcionalidades Principais

### 1. Board System
- Múltiplos boards (projetos)
- Colunas customizáveis (nome, cor, ordem) — padrão: "A Fazer", "Em Andamento", "Revisão", "Concluído"
- Switcher de board no topo da página

### 2. Kanban View
- Drag-and-drop entre colunas (usando @dnd-kit)
- Cards com: título, prioridade (badge colorido), responsável (avatar), data limite, tags
- Contagem de itens por coluna
- Reordenação dentro da coluna

### 3. Lista View
- Tabela com colunas: título, status, prioridade, responsável, data limite, tags
- Ordenação por qualquer coluna
- Inline editing rápido do status

### 4. Gantt View
- Timeline horizontal com barras por demanda (start_date → due_date)
- Scroll horizontal por semanas/meses
- Cores por prioridade
- Visualização compacta e funcional

### 5. Detalhe da Demanda (Sheet lateral)
- Título editável inline
- Descrição rica (textarea)
- Seletor de status, prioridade, responsável, datas
- Tags editáveis
- Seção de comentários
- Histórico de alterações

### 6. Filtros e Busca
- Barra de busca por título
- Filtros: prioridade, status, responsável, tags, data
- Toggle de visualização (Kanban / Lista / Gantt)

---

## Sidebar e Rotas

- Adicionar "Demandas" no sidebar com ícone `KanbanSquare`
- Rota: `/demandas` (página principal com board selecionado)

---

## Resumo Técnico

| Item | Detalhe |
|---|---|
| Tabelas novas | `demand_boards`, `demand_items`, `demand_comments` |
| Dependência nova | `@dnd-kit/core`, `@dnd-kit/sortable` (drag-and-drop) |
| Páginas | 1 página principal com 3 views |
| Componentes | ~10 componentes novos |
| RLS | Acesso por `user_id` em todas as tabelas |

