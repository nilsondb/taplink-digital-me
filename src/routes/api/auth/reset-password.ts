import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/reset-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ db }, auth, http] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/http"),
        ]);

        try {
          const body = await http.readJson<{ token?: string; password?: string }>(request);
          const token = String(body.token || "");
          const password = String(body.password || "");
          if (!token) return http.json({ error: "Link de recuperação inválido" }, 400);
          if (password.length < 8) return http.json({ error: "A senha deve ter pelo menos 8 caracteres" }, 400);

          const userId = auth.consumeResetToken(token);
          if (!userId) return http.json({ error: "Link inválido ou expirado" }, 400);

          const passwordHash = await auth.hashPassword(password);
          const tx = db.transaction(() => {
            db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
              .run(passwordHash, userId);
            db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
            db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(userId);
          });
          tx();

          return http.json({ ok: true });
        } catch (error) {
          console.error("reset-password error", error);
          return http.json({ error: "Não foi possível atualizar a senha" }, 500);
        }
      },
    },
  },
});
