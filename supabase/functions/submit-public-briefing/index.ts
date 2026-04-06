import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { briefingData } = await req.json();

    if (!briefingData || !briefingData.nomeEmpresa) {
      return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find a user to assign as owner (first admin, or first user)
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    let ownerId = adminRole?.user_id;

    if (!ownerId) {
      const { data: anyProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(1)
        .maybeSingle();
      ownerId = anyProfile?.user_id;
    }

    if (!ownerId) {
      return new Response(JSON.stringify({ error: "Nenhum usuário encontrado no sistema" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({
        name: briefingData.nomeEmpresa,
        nicho: briefingData.nichoAtuacao || null,
        instagram: briefingData.instagramEmpresa || null,
        site: briefingData.siteEmpresa || null,
        user_id: ownerId,
      })
      .select("id")
      .single();

    if (clientErr) throw clientErr;

    // Create briefing with pending_approval status
    const { data: briefing, error: briefErr } = await supabase
      .from("briefings")
      .insert({
        client_id: client.id,
        user_id: ownerId,
        data: briefingData,
        status: "pending_approval",
      })
      .select("id")
      .single();

    if (briefErr) throw briefErr;

    // Create notification
    await supabase.from("notifications").insert({
      user_id: ownerId,
      type: "briefing_pending",
      title: `Novo briefing: ${briefingData.nomeEmpresa}`,
      message: `Um cliente preencheu o briefing público e aguarda aprovação.`,
      link: `/clientes`,
    });

    return new Response(
      JSON.stringify({ success: true, clientId: client.id, briefingId: briefing.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
