import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_id, submission_data } = await req.json();

    if (!form_id || !submission_data) {
      return new Response(
        JSON.stringify({ error: "form_id and submission_data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to read form settings (form may belong to any user)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("name, settings")
      .eq("id", form_id)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Form not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = typeof form.settings === "object" && form.settings ? form.settings : {};
    const webhookUrl = (settings as any).webhookUrl;

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ message: "No webhook configured, skipping" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build webhook payload
    const payload = {
      event: "form_submission",
      form_id,
      form_name: form.name,
      submitted_at: new Date().toISOString(),
      data: submission_data,
    };

    const webhookHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const webhookSecret = (settings as any).webhookSecret;
    if (webhookSecret) {
      webhookHeaders["X-Webhook-Secret"] = webhookSecret;
    }

    // Fire the webhook (don't block the response on slow endpoints)
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify(payload),
    });

    const responseStatus = webhookResponse.status;
    await webhookResponse.text(); // consume body

    console.log(`Webhook sent to ${webhookUrl} — status: ${responseStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        webhook_status: responseStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error processing webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
