import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: "Arquivo muito grande (máx 10MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "application/pdf";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Analise este documento e extraia TODAS as informações relevantes para preencher um briefing estratégico de marketing/negócios.

Retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem \`\`\`) com EXATAMENTE esta estrutura. Preencha os campos encontrados e deixe string vazia "" para os não encontrados:

{
  "nomeEmpresa": "",
  "nichoAtuacao": "",
  "tempoMercado": "",
  "regiaoAtuacao": "",
  "instagramEmpresa": "",
  "siteEmpresa": "",
  "faturamentoAtual": "",
  "metaFaturamento": "",
  "ticketMedio": "",
  "orcamentoAnuncios": "",
  "nomeProduto": "",
  "precoProduto": "",
  "garantia": "",
  "diferenciais": ["", "", ""],
  "perfilClienteIdeal": "",
  "doresPublico": ["", "", ""],
  "desejosPublico": ["", "", ""],
  "concorrentes": [
    {"nome": "", "pontoFraco": "", "pontoForte": "", "precoEstimado": "", "siteConcorrente": ""},
    {"nome": "", "pontoFraco": "", "pontoForte": "", "precoEstimado": "", "siteConcorrente": ""},
    {"nome": "", "pontoFraco": "", "pontoForte": "", "precoEstimado": "", "siteConcorrente": ""}
  ],
  "equipeVendas": "",
  "ferramentas": "",
  "gargalo": "",
  "objecoes": ["", "", ""],
  "tomDeVoz": "",
  "canaisAtendimento": [],
  "objetivoCampanha": "",
  "plataformasAnuncio": [],
  "jaInvesteAnuncios": "",
  "investimentoMidia": "",
  "resultadosAtuais": "",
  "coresMarca": "",
  "provaSocial": ""
}

Regras:
- canaisAtendimento aceita: "WhatsApp", "Telefone", "Email", "Instagram DM", "Chat do site", "Presencial"
- plataformasAnuncio aceita: "Meta Ads (Facebook/Instagram)", "Google Ads", "TikTok Ads", "LinkedIn Ads", "YouTube Ads", "Pinterest Ads"
- jaInvesteAnuncios deve ser "sim" ou "não"
- Arrays de strings (diferenciais, doresPublico, desejosPublico, objecoes) devem ter pelo menos 3 items
- Extraia o máximo de informações possível do documento
- Se houver informações sobre concorrentes, preencha o array de concorrentes
- Retorne SOMENTE o JSON, nada mais`;

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI API error:", errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let briefingData;
    try {
      briefingData = JSON.parse(content);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Não foi possível extrair dados do documento. Tente com outro arquivo.");
    }

    return new Response(JSON.stringify({ briefingData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
