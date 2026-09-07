import { createFileRoute } from "@tanstack/react-router";

const slugRegex = /^[a-z0-9_-]{3,32}$/i;
const reserved = new Set(["api", "admin", "login", "signup", "dashboard", "edit", "forgot-password", "reset-password", "uploads", "authera"]);

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [{ getSessionUser }, { getProfileByUserId }, { json, noStoreHeaders }] = await Promise.all([
          import("@/server/auth"),
          import("@/server/profile"),
          import("@/server/http"),
        ]);
        const user = getSessionUser(request);
        if (!user) return json({ error: "Não autenticado" }, 401, noStoreHeaders);
        return json({ profile: getProfileByUserId(user.id) }, 200, noStoreHeaders);
      },

      PUT: async ({ request }) => {
        const [{ db, uploadsDir }, { getSessionUser }, profileLib, http, fs, path, crypto] = await Promise.all([
          import("@/server/db"),
          import("@/server/auth"),
          import("@/server/profile"),
          import("@/server/http"),
          import("node:fs/promises"),
          import("node:path"),
          import("node:crypto"),
        ]);

        const user = getSessionUser(request);
        if (!user) return http.json({ error: "Não autenticado" }, 401, http.noStoreHeaders);

        try {
          const form = await request.formData();
          const rawPayload = String(form.get("payload") || "{}");
          const payload = JSON.parse(rawPayload) as Record<string, unknown>;
          const slug = String(payload.slug || "").trim().toLowerCase();
          const name = String(payload.name || "").trim();

          if (!name) return http.json({ error: "Adicione seu nome" }, 400);
          if (!slugRegex.test(slug)) return http.json({ error: "Slug inválido" }, 400);
          if (reserved.has(slug)) return http.json({ error: "Este slug é reservado" }, 400);

          const existing = profileLib.getProfileByUserId(user.id);
          let photoUrl = existing?.photo_url || null;
          const removePhoto = Boolean(payload.remove_photo);
          const file = form.get("photo");

          if (removePhoto && photoUrl?.startsWith("/api/avatar/")) {
            const oldName = path.basename(photoUrl.slice("/api/avatar/".length));
            await fs.unlink(path.join(uploadsDir, oldName)).catch(() => {});
            photoUrl = null;
          }

          if (file instanceof File && file.size > 0) {
            if (file.size > 5 * 1024 * 1024) return http.json({ error: "A foto deve ter no máximo 5 MB" }, 400);
            const extByType: Record<string, string> = {
              "image/jpeg": "jpg",
              "image/png": "png",
              "image/webp": "webp",
            };
            const ext = extByType[file.type];
            if (!ext) return http.json({ error: "Use uma foto JPG, PNG ou WebP" }, 400);

            if (photoUrl?.startsWith("/api/avatar/")) {
              const oldName = path.basename(photoUrl.slice("/api/avatar/".length));
              await fs.unlink(path.join(uploadsDir, oldName)).catch(() => {});
            }

            const filename = `${user.id}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
            const bytes = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(path.join(uploadsDir, filename), bytes, { flag: "wx" });
            photoUrl = `/api/avatar/${filename}`;
          }

          const links = Array.isArray(payload.custom_links)
            ? payload.custom_links
                .filter((item) => item && typeof item === "object")
                .map((item) => ({
                  title: String((item as { title?: unknown }).title || "").trim().slice(0, 120),
                  url: String((item as { url?: unknown }).url || "").trim().slice(0, 2000),
                }))
                .filter((item) => item.title && item.url)
                .slice(0, 30)
            : [];

          const values = {
            slug,
            name: name.slice(0, 120),
            bio: String(payload.bio || "").trim().slice(0, 1000) || null,
            photo_url: photoUrl,
            instagram: String(payload.instagram || "").trim().slice(0, 500) || null,
            facebook: String(payload.facebook || "").trim().slice(0, 500) || null,
            tiktok: String(payload.tiktok || "").trim().slice(0, 500) || null,
            youtube: String(payload.youtube || "").trim().slice(0, 500) || null,
            linkedin: String(payload.linkedin || "").trim().slice(0, 500) || null,
            whatsapp: String(payload.whatsapp || "").trim().slice(0, 100) || null,
            telegram: String(payload.telegram || "").trim().slice(0, 500) || null,
            twitter: String(payload.twitter || "").trim().slice(0, 500) || null,
            website: String(payload.website || "").trim().slice(0, 500) || null,
            custom_links: JSON.stringify(links),
            theme: String(payload.theme || "neon-dark").slice(0, 40),
            show_event: payload.show_event ? 1 : 0,
            event_title: String(payload.event_title || "").trim().slice(0, 200) || null,
            event_date: String(payload.event_date || "").trim().slice(0, 20) || null,
            event_time: String(payload.event_time || "").trim().slice(0, 20) || null,
            event_location: String(payload.event_location || "").trim().slice(0, 300) || null,
            event_ticket_url: String(payload.event_ticket_url || "").trim().slice(0, 1000) || null,
            event_description: String(payload.event_description || "").trim().slice(0, 1500) || null,
          };

          if (existing) {
            db.prepare(`
              UPDATE profiles SET
                slug=@slug, name=@name, bio=@bio, photo_url=@photo_url,
                instagram=@instagram, facebook=@facebook, tiktok=@tiktok, youtube=@youtube,
                linkedin=@linkedin, whatsapp=@whatsapp, telegram=@telegram, twitter=@twitter,
                website=@website, custom_links=@custom_links, theme=@theme,
                show_event=@show_event, event_title=@event_title, event_date=@event_date,
                event_time=@event_time, event_location=@event_location,
                event_ticket_url=@event_ticket_url, event_description=@event_description,
                updated_at=datetime('now')
              WHERE user_id=@user_id
            `).run({ ...values, user_id: user.id });
          } else {
            db.prepare(`
              INSERT INTO profiles (
                id, user_id, slug, name, bio, photo_url,
                instagram, facebook, tiktok, youtube, linkedin, whatsapp, telegram, twitter, website,
                custom_links, theme, show_event, event_title, event_date, event_time,
                event_location, event_ticket_url, event_description
              ) VALUES (
                @id, @user_id, @slug, @name, @bio, @photo_url,
                @instagram, @facebook, @tiktok, @youtube, @linkedin, @whatsapp, @telegram, @twitter, @website,
                @custom_links, @theme, @show_event, @event_title, @event_date, @event_time,
                @event_location, @event_ticket_url, @event_description
              )
            `).run({ ...values, id: crypto.randomUUID(), user_id: user.id });
          }

          return http.json({ profile: profileLib.getProfileByUserId(user.id) }, 200, http.noStoreHeaders);
        } catch (error) {
          const e = error as { code?: string; message?: string };
          if (e.code === "SQLITE_CONSTRAINT_UNIQUE" || String(e.message || "").includes("UNIQUE constraint failed: profiles.slug")) {
            return http.json({ error: "Este slug já está em uso" }, 409);
          }
          console.error("profile save error", error);
          return http.json({ error: "Não foi possível salvar o perfil" }, 500);
        }
      },
    },
  },
});
