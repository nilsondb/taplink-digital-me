import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";

function load(db: import("better-sqlite3").Database, getPlatformMetrics: typeof import("@/server/profile").getPlatformMetrics) {
  const row = db.prepare("SELECT * FROM integration_settings WHERE id = 'default' LIMIT 1").get() as Record<string, unknown>;
  const logs = db.prepare("SELECT id, status, message, created_at FROM saas_center_sync_log ORDER BY created_at DESC LIMIT 20").all();
  return {
    settings: {
      id: "default",
      enabled: Boolean(row.enabled),
      saas_center_url: row.saas_center_url == null ? null : String(row.saas_center_url),
      integration_token: row.integration_token == null ? null : String(row.integration_token),
      last_sync: row.last_sync == null ? null : String(row.last_sync),
    },
    metrics: getPlatformMetrics(),
    logs,
  };
}

export const Route = createFileRoute("/api/admin/saas-settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [{ db }, { requireAdmin }, profile, http] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/profile"),
          import("@/server/http"),
        ]);
        if (!requireAdmin(request)) return http.json({ error: "Acesso negado" }, 403, http.noStoreHeaders);
        return http.json(load(db, profile.getPlatformMetrics), 200, http.noStoreHeaders);
      },

      PUT: async ({ request }) => {
        const [{ db }, { requireAdmin }, profile, http] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/profile"),
          import("@/server/http"),
        ]);
        if (!requireAdmin(request)) return http.json({ error: "Acesso negado" }, 403, http.noStoreHeaders);

        const body = await http.readJson<{ enabled?: boolean; saas_center_url?: string | null; integration_token?: string | null }>(request);
        const token = String(body.integration_token || "").trim();
        if (body.enabled && token.length < 24) {
          return http.json({ error: "Use um token com pelo menos 24 caracteres" }, 400);
        }

        db.prepare(`
          UPDATE integration_settings
          SET enabled = ?, saas_center_url = ?, integration_token = ?, updated_at = datetime('now')
          WHERE id = 'default'
        `).run(
          body.enabled ? 1 : 0,
          String(body.saas_center_url || "").trim().slice(0, 1000) || null,
          token || null,
        );
        db.prepare("INSERT INTO saas_center_sync_log (id, status, message) VALUES (?, 'success', ?)")
          .run(randomUUID(), "Configuração atualizada pelo administrador");

        return http.json(load(db, profile.getPlatformMetrics), 200, http.noStoreHeaders);
      },
    },
  },
});
