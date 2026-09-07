import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";

export const Route = createFileRoute("/api/auth/signup")({
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
          if (!/^\S+@\S+\.\S+$/.test(email)) return http.json({ error: "Informe um e-mail válido" }, 400);
          if (password.length < 8) return http.json({ error: "A senha deve ter pelo menos 8 caracteres" }, 400);

          const exists = db.prepare("SELECT 1 FROM users WHERE email = ? COLLATE NOCASE").get(email);
          if (exists) return http.json({ error: "Este e-mail já está cadastrado" }, 409);

          const id = randomUUID();
          const bootstrapEmail = String(process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
          const role = bootstrapEmail && email === bootstrapEmail ? "admin" : "user";
          const passwordHash = await auth.hashPassword(password);

          db.prepare(`
            INSERT INTO users (id, email, password_hash, role, status)
            VALUES (?, ?, ?, ?, 'active')
          `).run(id, email, passwordHash, role);

          const row = db.prepare("SELECT id, email, role, status, created_at FROM users WHERE id = ?").get(id) as Record<string, unknown>;
          const cookie = auth.createSession(request, id);

          return http.json(
            { user: auth.toPublicUser(row) },
            201,
            { ...http.noStoreHeaders, "Set-Cookie": cookie },
          );
        } catch (error) {
          console.error("signup error", error);
          return http.json({ error: "Não foi possível criar a conta" }, 500);
        }
      },
    },
  },
});
