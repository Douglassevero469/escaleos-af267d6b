import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, answers } = await req.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Nome e email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the first pipeline (or create one)
    let { data: pipeline } = await supabase
      .from("crm_pipelines")
      .select("id, user_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!pipeline) {
      // Get first user to be the owner
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: "Nenhum usuário encontrado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newPipeline, error: pipelineError } = await supabase
        .from("crm_pipelines")
        .insert({ user_id: profile.user_id, name: "Pipeline Principal" })
        .select("id, user_id")
        .single();

      if (pipelineError) throw pipelineError;
      pipeline = newPipeline;
    }

    // Build custom_fields with all quiz answers
    const quizLabels = [
      "Maior desafio",
      "Plano comercial estruturado",
      "Investiu em tráfego pago",
      "Tem CRM",
      "Faturamento mensal",
      "Investimento disponível",
    ];

    const custom_fields: Record<string, string> = { origem: "LP3 Quiz" };
    if (answers && Array.isArray(answers)) {
      answers.forEach((answer: string, i: number) => {
        custom_fields[quizLabels[i] || `Pergunta ${i + 1}`] = answer;
      });
    }

    const { error: leadError } = await supabase.from("crm_leads").insert({
      pipeline_id: pipeline.id,
      user_id: pipeline.user_id,
      name: name.trim(),
      email: email.trim(),
      phone: (phone || "").trim(),
      stage: "new",
      custom_fields,
      tags: ["LP3", "Quiz"],
      notes: `Lead capturado via Quiz LP3.\nRespostas: ${(answers || []).join(" | ")}`,
    });

    if (leadError) throw leadError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
