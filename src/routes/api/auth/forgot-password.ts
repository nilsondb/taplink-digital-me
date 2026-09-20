import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";

export const Route = createFileRoute("/api/auth/forgot-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ db }, auth, http] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/http"),
        ]);

        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || user;
        if (!host || !user || !pass || !from) {
          return http.json({ error: "Recuperação por e-mail ainda não está configurada neste servidor." }, 503);
        }

        try {
          const body = await http.readJson<{ email?: string }>(request);
          const email = String(body.email || "").trim().toLowerCase();
          if (!email) return http.json({ error: "Informe seu e-mail" }, 400);

          const row = db.prepare("SELECT id, email FROM users WHERE email = ? COLLATE NOCASE AND status = 'active' LIMIT 1")
            .get(email) as { id: string; email: string } | undefined;

          if (row) {
            const token = auth.createResetToken(row.id);
            const appUrl = String(process.env.APP_URL || new URL(request.url).origin).replace(/\/$/, "");
            const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
            const port = Number(process.env.SMTP_PORT || 587);
            const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
            const transport = nodemailer.createTransport({
              host,
              port,
              secure,
              auth: { user, pass },
            });

            await transport.sendMail({
              from,
              to: row.email,
              subject: "Redefinir senha — Authera Link Card",
              text: `Recebemos uma solicitação para redefinir sua senha. Use este link em até 30 minutos: ${resetUrl}`,
              html: `<p>Recebemos uma solicitação para redefinir sua senha no <strong>Authera Link Card</strong>.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>O link expira em 30 minutos.</p>`,
            });
          }

          return http.json({ ok: true, message: "Se o e-mail estiver cadastrado, enviaremos as instruções." });
        } catch (error) {
          console.error("forgot-password error", error);
          return http.json({ error: "Não foi possível processar a recuperação agora." }, 500);
        }
      },
    },
  },
});
