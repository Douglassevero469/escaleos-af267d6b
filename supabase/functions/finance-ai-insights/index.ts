// AI-powered financial insights — analyzes the workspace's finance data and returns
// strategic observations using Lovable AI Gateway (Gemini).
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface Snapshot {
  mrr: number;
  totalExp: number;
  result: number;
  cashCurrent: number;
  burnRate: number;
  netMargin: number;
  churnRate: number;
  mrrGrowth: number;
  payrollPct: number;
  concentration: number;
  topClients: { name: string; value: number }[];
  topExpenses: { name: string; value: number }[];
  upcoming7d: number;
  forecast30: number;
  forecast60: number;
  forecast90: number;
  forecastNegativeDay: string | null;
  activeClients: number;
  activeTeam: number;
  ticket: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { snapshot, period } = (await req.json()) as { snapshot: Snapshot; period: string };

    const prompt = `Você é um CFO virtual analisando o snapshot financeiro de uma agência de marketing. Período: ${period}.

DADOS:
- MRR (receita mensal recorrente): R$ ${snapshot.mrr.toFixed(2)}
- Despesas mensais totais: R$ ${snapshot.totalExp.toFixed(2)}
- Resultado mensal: R$ ${snapshot.result.toFixed(2)}
- Caixa atual: R$ ${snapshot.cashCurrent.toFixed(2)}
- Burn Rate: R$ ${snapshot.burnRate.toFixed(2)}/mês
- Margem líquida: ${snapshot.netMargin.toFixed(1)}%
- Churn rate: ${snapshot.churnRate.toFixed(1)}%
- Crescimento MRR: ${snapshot.mrrGrowth.toFixed(1)}%
- % Folha sobre receita: ${snapshot.payrollPct.toFixed(1)}%
- Concentração Top 3 clientes: ${snapshot.concentration}%
- Clientes ativos: ${snapshot.activeClients}
- Equipe ativa: ${snapshot.activeTeam}
- Ticket médio: R$ ${snapshot.ticket.toFixed(2)}
- A vencer próximos 7 dias: R$ ${snapshot.upcoming7d.toFixed(2)}
- Forecast 30d: R$ ${snapshot.forecast30.toFixed(2)}
- Forecast 60d: R$ ${snapshot.forecast60.toFixed(2)}
- Forecast 90d: R$ ${snapshot.forecast90.toFixed(2)}
${snapshot.forecastNegativeDay ? `- ⚠️ ALERTA: Caixa fica negativo em ${snapshot.forecastNegativeDay}` : ""}

TOP CLIENTES: ${snapshot.topClients.map(c => `${c.name} (R$${c.value.toFixed(0)})`).join(", ") || "—"}
TOP DESPESAS: ${snapshot.topExpenses.map(e => `${e.name} (R$${e.value.toFixed(0)})`).join(", ") || "—"}

Gere uma análise estratégica concisa em português brasileiro com:

1. **Diagnóstico** (2-3 linhas com avaliação geral da saúde financeira)
2. **Pontos fortes** (2-3 bullets)
3. **Riscos identificados** (2-3 bullets, com priorização)
4. **Recomendações acionáveis** (3-4 bullets concretos e específicos, com números quando possível)

Seja direto, evite jargão. Use markdown. Não invente dados — analise apenas o que foi fornecido.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um CFO experiente que dá conselhos financeiros estratégicos para agências de marketing." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResp.status}: ${txt}`);
    }

    const data = await aiResp.json();
    const insight = data.choices?.[0]?.message?.content || "Sem resposta.";

    return new Response(JSON.stringify({ insight, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
