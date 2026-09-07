import { createFileRoute } from "@tanstack/react-router";

function payload(metrics: ReturnType<typeof import("@/server/profile").getPlatformMetrics>) {
  return {
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
}

export const Route = createFileRoute("/api/saas-center")({
  server: {
    handlers: {
      GET: async () => {
        const [{ getPlatformMetrics }, { json }] = await Promise.all([
          import("@/server/profile"),
          import("@/server/http"),
        ]);
        return json(payload(getPlatformMetrics()), 200, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        });
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
