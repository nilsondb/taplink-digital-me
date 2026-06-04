import { createFileRoute } from "@tanstack/react-router";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function emptyPayload() {
  return {
    app_name: "TapLink NFC",
    status: "online",
    total_users: 0,
    active_users: 0,
    premium_users: 0,
    subscriptions: 0,
    monthly_revenue: 0,
    annual_revenue: 0,
    new_users_today: 0,
    new_users_month: 0,
    cancellations_month: 0,
    custom_metrics: {
      links_ativos: 0,
      acessos: 0,
      cartoes_nfc: 0,
    },
    last_update: "",
  };
}

export const Route = createFileRoute("/api/saas-center")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Try to refresh metrics; ignore errors
          try {
            await supabaseAdmin.rpc("recompute_app_metrics");
          } catch {
            // ignore
          }

          const { data: m } = await supabaseAdmin
            .from("app_metrics")
            .select("*")
            .limit(1)
            .maybeSingle();

          // Aggregate TapLink-specific custom metrics
          let links_ativos = 0;
          let acessos = 0;
          const cartoes_nfc = 0;
          try {
            const { data: profiles } = await supabaseAdmin
              .from("profiles")
              .select("custom_links, views_count, status");
            if (profiles) {
              for (const p of profiles as Array<{
                custom_links: unknown;
                views_count: number | null;
                status: string | null;
              }>) {
                if (p.status === "active" && Array.isArray(p.custom_links)) {
                  links_ativos += p.custom_links.length;
                }
                acessos += p.views_count ?? 0;
              }
            }
          } catch {
            // ignore
          }

          const existingCustom =
            (m?.custom_metrics && typeof m.custom_metrics === "object"
              ? (m.custom_metrics as Record<string, unknown>)
              : {}) ?? {};

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
            custom_metrics: {
              ...existingCustom,
              links_ativos,
              acessos,
              cartoes_nfc,
            },
            last_update: m?.last_update ?? new Date().toISOString(),
          };

          return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });
        } catch (err) {
          console.error("saas-center public endpoint error", err);
          // Never return 500 — return zeroed payload
          return new Response(JSON.stringify(emptyPayload()), {
            status: 200,
            headers: jsonHeaders,
          });
        }
      },
    },
  },
});
