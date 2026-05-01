import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  month: string;       // YYYY-MM
  user_id?: string;    // requerido para chamadas server (cron)
  trigger?: "manual" | "auto" | "scheduled";
  mode?: "replace" | "append";
}

const pad = (n: number) => String(n).padStart(2, "0");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const trigger = body.trigger || "manual";
  const mode = body.mode || "replace";
  const month = body.month;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Response(JSON.stringify({ error: "month inválido (esperado YYYY-MM)" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolver user_id
  let userId = body.user_id;
  if (!userId) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sem autenticação" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = u.user.id;
  }

  // Cria run em status running
  const { data: runRow, error: runErr } = await admin
    .from("finance_generation_runs")
    .insert({
      user_id: userId, month, trigger, mode, status: "running",
      message: "Iniciando geração...",
    })
    .select("id").single();

  if (runErr || !runRow) {
    return new Response(JSON.stringify({ error: runErr?.message || "Falha ao criar run" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const runId = runRow.id;

  try {
    // Carrega recorrências
    const [{ data: revenues }, { data: expenses }, { data: team }] = await Promise.all([
      admin.from("finance_recurring_revenues").select("*").eq("status", "active"),
      admin.from("finance_recurring_expenses").select("*").eq("active", true),
      admin.from("finance_team_members").select("*").eq("status", "active"),
    ]);

    const items: any[] = [];
    let revCount = 0, expCount = 0, payCount = 0, totalAmount = 0;

    (revenues || []).forEach((r: any) => {
      const amount = Number(r.amount);
      items.push({
        user_id: userId, kind: "income",
        description: `${r.client_name} — Mensalidade`,
        amount, due_date: `${month}-${pad(r.payment_day || 5)}`,
        status: "pending", reference_type: "recurring_revenue", reference_id: r.id,
      });
      revCount++; totalAmount += amount;
    });

    (expenses || []).forEach((e: any) => {
      const amount = Number(e.amount);
      items.push({
        user_id: userId, kind: "expense",
        description: `${e.name}${e.vendor ? ` (${e.vendor})` : ""}`,
        amount, due_date: `${month}-${pad(e.payment_day || 5)}`,
        status: "pending", reference_type: "recurring_expense", reference_id: e.id,
      });
      expCount++; totalAmount += amount;
    });

    (team || []).filter((t: any) => Number(t.monthly_cost) > 0).forEach((t: any) => {
      const amount = Number(t.monthly_cost);
      const tipo = t.compensation_type === "salary" ? "Salário"
                 : t.compensation_type === "prolabore" ? "Pró-labore" : "PJ";
      items.push({
        user_id: userId, kind: "expense",
        description: `${t.name || t.role} — ${tipo}`,
        amount, due_date: `${month}-05`, status: "pending",
        reference_type: "team_payroll", reference_id: t.id,
      });
      payCount++; totalAmount += amount;
    });

    if (!items.length) {
      await admin.from("finance_generation_runs").update({
        status: "partial", message: "Nenhuma recorrência ativa encontrada",
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
      return new Response(JSON.stringify({
        run_id: runId, status: "partial", inserted: 0, message: "Sem recorrências",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const start = `${month}-01`;
    const end = `${month}-31`;
    let deletedCount = 0;

    if (mode === "replace") {
      const { count } = await admin.from("finance_transactions")
        .delete({ count: "exact" })
        .gte("due_date", start).lte("due_date", end)
        .neq("reference_type", "manual");
      deletedCount = count || 0;
    }

    const { error: insErr } = await admin.from("finance_transactions").insert(items);
    if (insErr) throw insErr;

    await admin.from("finance_generation_runs").update({
      status: "success",
      revenues_count: revCount, expenses_count: expCount, payroll_count: payCount,
      total_inserted: items.length, total_deleted: deletedCount, total_amount: totalAmount,
      message: `${items.length} lançamentos gerados (${revCount} receitas, ${expCount} despesas, ${payCount} folha)`,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);

    return new Response(JSON.stringify({
      run_id: runId, status: "success",
      inserted: items.length, deleted: deletedCount,
      revenues: revCount, expenses: expCount, payroll: payCount, total_amount: totalAmount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    await admin.from("finance_generation_runs").update({
      status: "error",
      message: err?.message || "Erro inesperado",
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: err?.message, run_id: runId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
