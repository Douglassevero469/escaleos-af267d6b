import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DOC_TYPES = [
  { type: "plano_comercial", title: "Plano Comercial Estratégico" },
  { type: "proposta_comercial", title: "Proposta Comercial" },
  { type: "roteiro_vendas", title: "Roteiro de Vendas" },
  { type: "script_prospeccao", title: "Script de Prospecção" },
  { type: "plano_marketing", title: "Plano de Marketing" },
  { type: "analise_concorrencia", title: "Análise de Concorrência" },
  { type: "analise_swot", title: "Análise SWOT" },
  { type: "resumo_executivo", title: "Resumo Executivo" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefingData, docType, clientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const docInfo = DOC_TYPES.find(d => d.type === docType);
    if (!docInfo) throw new Error("Invalid document type");

    const systemPrompt = `Você é um consultor de negócios estratégico especializado em criar documentos comerciais profissionais.
Você está gerando um "${docInfo.title}" para o cliente "${clientName}".
Use os dados do briefing fornecido para criar um documento completo, profissional e estratégico.
Formate o documento em Markdown com seções claras, headers, bullet points e tabelas quando apropriado.
O documento deve ser detalhado, com no mínimo 1500 palavras, e conter insights estratégicos reais baseados nos dados.
Use linguagem profissional em português brasileiro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados do briefing:\n${JSON.stringify(briefingData, null, 2)}\n\nGere o documento "${docInfo.title}" completo.` },
        ],
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
