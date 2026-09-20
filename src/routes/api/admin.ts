import { createFileRoute } from "@tanstack/react-router";

function loadAdminData(db: import("better-sqlite3").Database) {
  const users = db.prepare(`
    SELECT
      u.id AS user_id,
      u.email,
      u.created_at,
      u.role,
      u.status AS user_status,
      p.id AS profile_id,
      p.name,
      p.slug,
      p.photo_url,
      p.status,
      COALESCE(p.views_count, 0) AS views_count,
      COALESCE(p.clicks_count, 0) AS clicks_count
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC
  `).all().map((row) => {
    const r = row as Record<string, unknown>;
    return {
      user_id: String(r.user_id),
      email: String(r.email),
      created_at: String(r.created_at),
      is_admin: r.role === "admin",
      user_status: r.user_status === "inactive" ? "inactive" : "active",
      profile_id: r.profile_id == null ? null : String(r.profile_id),
      name: r.name == null ? null : String(r.name),
      slug: r.slug == null ? null : String(r.slug),
      photo_url: r.photo_url == null ? null : String(r.photo_url),
      status: r.status == null ? null : String(r.status),
      views_count: Number(r.views_count || 0),
      clicks_count: Number(r.clicks_count || 0),
    };
  });

  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM profiles) AS total_profiles,
      (SELECT COALESCE(SUM(views_count),0) FROM profiles) AS total_views,
      (SELECT COALESCE(SUM(clicks_count),0) FROM profiles) AS total_clicks,
      (SELECT COUNT(*) FROM users WHERE date(created_at)=date('now')) AS users_today
  `).get() as Record<string, number>;

  const growthRows = db.prepare(`
    WITH RECURSIVE days(day) AS (
      SELECT date('now', '-29 days')
      UNION ALL
      SELECT date(day, '+1 day') FROM days WHERE day < date('now')
    )
    SELECT days.day, COUNT(users.id) AS count
    FROM days
    LEFT JOIN users ON date(users.created_at) = days.day
    GROUP BY days.day
    ORDER BY days.day
  `).all() as Array<{ day: string; count: number }>;

  return {
    users,
    stats: {
      total_users: Number(totals.total_users || 0),
      total_profiles: Number(totals.total_profiles || 0),
      total_views: Number(totals.total_views || 0),
      total_clicks: Number(totals.total_clicks || 0),
      users_today: Number(totals.users_today || 0),
      growth: growthRows.map((r) => ({ day: r.day, count: Number(r.count || 0) })),
    },
  };
}

export const Route = createFileRoute("/api/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [{ db }, { requireAdmin }, { json, noStoreHeaders }] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/http"),
        ]);
        if (!requireAdmin(request)) return json({ error: "Acesso negado" }, 403, noStoreHeaders);
        return json(loadAdminData(db), 200, noStoreHeaders);
      },

      POST: async ({ request }) => {
        const [{ db }, { requireAdmin }, http] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/http"),
        ]);
        const admin = requireAdmin(request);
        if (!admin) return http.json({ error: "Acesso negado" }, 403, http.noStoreHeaders);

        try {
          const body = await http.readJson<{ action?: string; user_id?: string; value?: unknown }>(request);
          const userId = String(body.user_id || "");
          if (!userId) return http.json({ error: "Usuário inválido" }, 400);

          if (body.action === "set-role") {
            if (userId === admin.id && body.value !== "admin") {
              return http.json({ error: "Você não pode remover sua própria permissão de administrador" }, 400);
            }
            const role = body.value === "admin" ? "admin" : "user";
            db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, userId);
          } else if (body.action === "set-status") {
            if (userId === admin.id && body.value === "inactive") {
              return http.json({ error: "Você não pode desativar sua própria conta" }, 400);
            }
            const status = body.value === "inactive" ? "inactive" : "active";
            const tx = db.transaction(() => {
              db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, userId);
              db.prepare("UPDATE profiles SET status = ?, updated_at = datetime('now') WHERE user_id = ?").run(status, userId);
              if (status === "inactive") db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
            });
            tx();
          } else if (body.action === "delete") {
            if (userId === admin.id) return http.json({ error: "Você não pode excluir sua própria conta" }, 400);
            db.prepare("DELETE FROM users WHERE id = ?").run(userId);
          } else {
            return http.json({ error: "Ação inválida" }, 400);
          }

          return http.json(loadAdminData(db), 200, http.noStoreHeaders);
        } catch (error) {
          console.error("admin action error", error);
          return http.json({ error: "Não foi possível concluir a ação" }, 500);
        }
      },
    },
  },
});
