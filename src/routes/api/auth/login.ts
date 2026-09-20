import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ db }, auth, http] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/http"),
        ]);

        try {
          const body = await http.readJson<{ email?: string; password?: string }>(request);
          const email = String(body.email || "").trim().toLowerCase();
          const password = String(body.password || "");
          if (!email || !password) return http.json({ error: "Informe e-mail e senha" }, 400);

          const row = db.prepare(`
            SELECT id, email, password_hash, role, status, created_at
            FROM users WHERE email = ? COLLATE NOCASE LIMIT 1
          `).get(email) as Record<string, unknown> | undefined;

          if (!row || !(await auth.verifyPassword(password, String(row.password_hash)))) {
            return http.json({ error: "E-mail ou senha inválidos" }, 401);
          }
          if (row.status !== "active") {
            return http.json({ error: "Conta desativada. Procure o administrador." }, 403);
          }

          const cookie = auth.createSession(request, String(row.id));
          return http.json(
            { user: auth.toPublicUser(row) },
            200,
            { ...http.noStoreHeaders, "Set-Cookie": cookie },
          );
        } catch (error) {
          console.error("login error", error);
          return http.json({ error: "Não foi possível entrar" }, 500);
        }
      },
    },
  },
});
