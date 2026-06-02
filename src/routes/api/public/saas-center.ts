import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/saas-center")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const jsonHeaders = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        };

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: settings } = await supabaseAdmin
            .from("integration_settings")
            .select("enabled, integration_token, last_sync")
            .limit(1)
            .maybeSingle();

          if (!settings?.enabled) {
            return new Response(
              JSON.stringify({ error: "Integration disabled" }),
              { status: 403, headers: jsonHeaders },
            );
          }

          const authHeader = request.headers.get("authorization") ?? "";
          const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
          if (!settings.integration_token || provided !== settings.integration_token) {
            return new Response(
              JSON.stringify({ error: "Unauthorized" }),
              { status: 401, headers: jsonHeaders },
            );
          }

          const { data: m } = await supabaseAdmin
            .from("app_metrics")
            .select("*")
            .limit(1)
            .maybeSingle();

          await supabaseAdmin
            .from("integration_settings")
            .update({ last_sync: new Date().toISOString() })
            .neq("id", "00000000-0000-0000-0000-000000000000");

          const body = {
            app_name: "TapLink NFC",
            status: "online",
            total_users: m?.total_users ?? 0,
            active_users: m?.active_users ?? 0,
            premium_users: m?.premium_users ?? 0,
            subscriptions: m?.total_subscriptions ?? 0,
            monthly_revenue: Number(m?.monthly_revenue ?? 0),
            annual_revenue: Number(m?.annual_revenue ?? 0),
            new_users_today: m?.new_users_today ?? 0,
            new_users_month: m?.new_users_month ?? 0,
            cancellations_month: m?.cancellations_month ?? 0,
            custom_metrics: m?.custom_metrics ?? {},
            last_update: m?.last_update ?? null,
          };

          return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });
        } catch (err) {
          console.error("saas-center endpoint error", err);
          return new Response(
            JSON.stringify({ error: "Internal error" }),
            { status: 500, headers: jsonHeaders },
          );
        }
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
    },
  },
});
