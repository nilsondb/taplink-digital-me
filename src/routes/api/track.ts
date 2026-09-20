import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ db }, http, crypto] = await Promise.all([
          import("@/server/db"),
          import("@/server/http"),
          import("node:crypto"),
        ]);

        try {
          const body = await http.readJson<{
            profile_id?: string;
            event?: "view" | "click";
            link_type?: "social" | "custom";
            link_key?: string;
            referrer?: string | null;
            user_agent?: string | null;
          }>(request);

          const profileId = String(body.profile_id || "");
          if (!profileId) return http.json({ error: "Perfil inválido" }, 400);
          const exists = db.prepare("SELECT 1 FROM profiles WHERE id = ? AND status = 'active'").get(profileId);
          if (!exists) return http.json({ error: "Perfil não encontrado" }, 404);

          if (body.event === "view") {
            const tx = db.transaction(() => {
              db.prepare("INSERT INTO profile_views (id, profile_id, referrer, user_agent) VALUES (?, ?, ?, ?)")
                .run(
                  crypto.randomUUID(),
                  profileId,
                  body.referrer ? String(body.referrer).slice(0, 1000) : null,
                  body.user_agent ? String(body.user_agent).slice(0, 512) : null,
                );
              db.prepare("UPDATE profiles SET views_count = views_count + 1 WHERE id = ?").run(profileId);
            });
            tx();
          } else if (body.event === "click") {
            const linkType = body.link_type === "custom" ? "custom" : "social";
            const linkKey = String(body.link_key || "").slice(0, 200);
            if (!linkKey) return http.json({ error: "Link inválido" }, 400);
            const tx = db.transaction(() => {
              db.prepare("INSERT INTO link_clicks (id, profile_id, link_type, link_key) VALUES (?, ?, ?, ?)")
                .run(crypto.randomUUID(), profileId, linkType, linkKey);
              db.prepare("UPDATE profiles SET clicks_count = clicks_count + 1 WHERE id = ?").run(profileId);
            });
            tx();
          } else {
            return http.json({ error: "Evento inválido" }, 400);
          }

          return http.json({ ok: true });
        } catch (error) {
          console.error("track error", error);
          return http.json({ error: "Não foi possível registrar a métrica" }, 500);
        }
      },
    },
  },
});
