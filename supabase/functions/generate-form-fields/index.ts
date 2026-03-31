import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TYPES = [
  "short_text", "long_text", "email", "phone", "url", "cpf",
  "number", "currency", "rating", "slider",
  "select", "radio", "radio_cards", "checkbox", "selection", "image_choice", "yes_no", "switch",
  "date", "time", "datetime",
  "file", "heading", "paragraph", "divider", "spacer",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Descrição inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em criação de formulários de captura de leads. 
Dado uma descrição do usuário, gere os campos do formulário como um array JSON.

Tipos de campo disponíveis: ${VALID_TYPES.join(", ")}

Regras:
- Retorne APENAS o JSON, sem texto antes ou depois
- Cada campo deve ter: id (uuid v4), type, label, width ("full" ou "half")
- Campos de seleção (select, radio, radio_cards, checkbox, selection, yes_no) devem ter "options" (array de strings)
- Campos de texto podem ter "placeholder"
- Marque campos importantes como "required": true
- Use "heading" para separar seções quando fizer sentido
- Use tipos apropriados: email para email, phone para telefone, cpf para CPF, etc.
- Gere entre 4 e 15 campos dependendo da complexidade
- Labels devem ser em português brasileiro
- Seja criativo mas prático nos campos gerados

Exemplo de saída:
[
  {"id": "uuid-1", "type": "heading", "label": "Dados Pessoais", "width": "full"},
  {"id": "uuid-2", "type": "short_text", "label": "Nome Completo", "placeholder": "Seu nome", "required": true, "width": "full"},
  {"id": "uuid-3", "type": "email", "label": "E-mail", "placeholder": "seu@email.com", "required": true, "width": "half"}
]`;

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
          { role: "user", content: description },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const fields = JSON.parse(jsonStr);

    // Validate and sanitize fields
    const validFields = fields
      .filter((f: any) => f.type && VALID_TYPES.includes(f.type) && f.label)
      .map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        type: f.type,
        label: f.label,
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...(f.required ? { required: true } : {}),
        ...(f.options && Array.isArray(f.options) ? { options: f.options } : {}),
        width: f.width === "half" ? "half" : "full",
        ...(f.validations ? { validations: f.validations } : {}),
      }));

    return new Response(JSON.stringify({ fields: validFields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-form-fields error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao gerar campos" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
