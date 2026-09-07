import { createFileRoute } from "@tanstack/react-router";
import { randomUUID, timingSafeEqual } from "node:crypto";

function equalToken(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export const Route = createFileRoute("/api/public/saas-center")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [{ db }, { getPlatformMetrics }, { json }] = await Promise.all([
          import("@/server/db"),
          import("@/server/profile"),
          import("@/server/http"),
        ]);

        const settings = db.prepare("SELECT * FROM integration_settings WHERE id = 'default' LIMIT 1").get() as {
          enabled: number;
          integration_token: string | null;
        } | undefined;
        if (!settings?.enabled || !settings.integration_token) return json({ error: "Integração desativada" }, 404);

        const auth = request.headers.get("authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!token || !equalToken(token, settings.integration_token)) return json({ error: "Token inválido" }, 401);

        const metrics = getPlatformMetrics();
        const body = {
          app_name: "Authera Link Card",
          status: "online",
          total_users: metrics.totalUsers,
          active_users: metrics.activeUsers,
          premium_users: 0,
          subscriptions: 0,
          monthly_revenue: 0,
          annual_revenue: 0,
          new_users_today: metrics.newUsersToday,
          new_users_month: metrics.newUsersMonth,
          cancellations_month: 0,
          custom_metrics: {
            perfis: metrics.totalProfiles,
            links_ativos: metrics.activeLinks,
            acessos: metrics.totalViews,
            cliques: metrics.totalClicks,
            cartoes_nfc: 0,
          },
          last_update: new Date().toISOString(),
        };

        const tx = db.transaction(() => {
          db.prepare("UPDATE integration_settings SET last_sync = datetime('now'), updated_at = datetime('now') WHERE id = 'default'").run();
          db.prepare("INSERT INTO saas_center_sync_log (id, status, message) VALUES (?, 'success', ?)")
            .run(randomUUID(), "Consulta autenticada de métricas");
        });
        tx();

        return json(body, 200, { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
      },
      OPTIONS: async () => new Response(null, {
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
