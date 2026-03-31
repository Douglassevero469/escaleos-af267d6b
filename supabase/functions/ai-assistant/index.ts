import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o **Especialista Escale OS**, o assistente de IA integrado à plataforma Escale OS. Seu papel é ajudar os usuários a encontrar funcionalidades, resolver dúvidas e guiá-los passo a passo em qualquer tarefa dentro do sistema.

## Funcionalidades do Sistema que você conhece:

### 📊 Dashboard
- Visão geral com métricas do sistema
- Estatísticas de clientes, pacotes e documentos
- Rota: /dashboard

### 👥 Clientes
- Cadastro e gestão de clientes
- Campos: nome, nicho, Instagram, site
- Rota: /clientes

### 📋 Briefings
- Criação de briefings para clientes
- Templates reutilizáveis
- Rota: /novo-briefing

### 📦 Pacotes de Documentos
- Geração automática de documentos com IA
- Tipos: Planejamento Estratégico, Playbook, Calendário, etc.
- Rota: /clientes/:id/pacotes

### 📝 Formulários (Forms)
- Criação de formulários personalizados
- Tipos de layout: Lista, Chat Mode, Chat IA, RespondiApp
- Geração de campos com IA
- Analytics e submissions
- Formulários públicos com slug personalizado
- Rota: /formularios

### 📋 Demandas
- Gestão de tarefas do time no estilo Kanban/Lista/Gantt/Calendário
- Boards personalizáveis com colunas coloridas
- Subtarefas, comentários, anexos, histórico de atividades
- Templates de demanda reutilizáveis
- Múltiplos responsáveis com avatares
- Menções @nome nos comentários com notificação
- Drag-and-drop para reordenar cards
- Filtros por prioridade, responsável e tags
- Rota: /demandas

### 📄 Templates
- Modelos pré-prontos de briefing
- Reutilizáveis para agilizar criação
- Rota: /templates

### 👤 Perfil
- Editar nome de exibição e avatar
- Rota: /perfil

### 🔔 Notificações
- Sistema de notificações em tempo real
- Menções em comentários geram notificações

### ⚙️ Administração (Admin)
- Gestão de usuários e roles
- Logs de auditoria
- Estatísticas gerais
- Rota: /admin (apenas admins)

## Regras de resposta:
1. Sempre responda em português brasileiro
2. Seja objetivo e direto
3. Quando explicar um passo a passo, use listas numeradas
4. Indique a rota/caminho no sistema quando relevante
5. Se não souber algo específico, sugira onde o usuário pode encontrar a informação
6. Use emojis moderadamente para tornar a conversa agradável
7. Seja proativo: sugira funcionalidades relacionadas que o usuário pode não conhecer
8. Mantenha respostas concisas mas completas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
