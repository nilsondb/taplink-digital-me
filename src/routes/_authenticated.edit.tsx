import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SOCIALS, sanitizeSlug, SLUG_REGEX, RESERVED_SLUGS, type CustomLink, type SocialKey } from "@/lib/social";
import { ProfilePreview, type ProfileData } from "@/components/ProfilePreview";
import { THEMES, type ThemeKey } from "@/lib/themes";

import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/edit")({
  head: () => ({ meta: [{ title: "Editar perfil — TapLink NFC" }] }),
  component: EditPage,
});

function EditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [socials, setSocials] = useState<Partial<Record<SocialKey, string>>>({});
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [theme, setTheme] = useState<ThemeKey>("neon-dark");

  const [showEvent, setShowEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTicketUrl, setEventTicketUrl] = useState("");
  const [eventDescription, setEventDescription] = useState("");


  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setExisting(data);
        setSlug(data.slug); setName(data.name); setBio(data.bio || "");
        setPhotoPreview(data.photo_url);
        setSocials({
          instagram: data.instagram || "", facebook: data.facebook || "", tiktok: data.tiktok || "",
          youtube: data.youtube || "", linkedin: data.linkedin || "", whatsapp: data.whatsapp || "",
          telegram: data.telegram || "", twitter: data.twitter || "", website: data.website || "",
        });
        setCustomLinks(((data.custom_links as unknown) as CustomLink[]) || []);
        setTheme(((data as { theme?: ThemeKey }).theme as ThemeKey) || "neon-dark");
        const d = data as Record<string, unknown>;
        setShowEvent(Boolean(d.show_event));
        setEventTitle((d.event_title as string) || "");
        setEventDate((d.event_date as string) || "");
        setEventTime(((d.event_time as string) || "").slice(0, 5));
        setEventLocation((d.event_location as string) || "");
        setEventTicketUrl((d.event_ticket_url as string) || "");
        setEventDescription((d.event_description as string) || "");
      }
      setLoading(false);
    });
  }, [user]);

  function handlePhoto(file: File | null) {
    setPhotoFile(file);
    if (!file) { setPhotoPreview(existing?.photo_url ?? null); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!user) return;
    if (!name.trim()) { toast.error("Adicione seu nome"); return; }
    const cleanSlug = sanitizeSlug(slug);
    if (!SLUG_REGEX.test(cleanSlug)) { toast.error("Slug: 3-32 caracteres (letras, números, - ou _)"); return; }
    if (RESERVED_SLUGS.has(cleanSlug.toLowerCase())) { toast.error("Este slug é reservado"); return; }

    setSaving(true);
    try {
      let photoUrl = existing?.photo_url ?? null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        photoUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
      }

      const cleanedLinks = customLinks.filter((l) => l.title.trim() && l.url.trim());
      const payload = {
        user_id: user.id,
        slug: cleanSlug, name: name.trim(), bio: bio.trim() || null, photo_url: photoUrl,
        instagram: socials.instagram?.trim() || null, facebook: socials.facebook?.trim() || null,
        tiktok: socials.tiktok?.trim() || null, youtube: socials.youtube?.trim() || null,
        linkedin: socials.linkedin?.trim() || null, whatsapp: socials.whatsapp?.trim() || null,
        telegram: socials.telegram?.trim() || null, twitter: socials.twitter?.trim() || null,
        website: socials.website?.trim() || null,
        custom_links: cleanedLinks,
        theme,
        show_event: showEvent,
        event_title: eventTitle.trim() || null,
        event_date: eventDate || null,
        event_time: eventTime || null,
        event_location: eventLocation.trim() || null,
        event_ticket_url: eventTicketUrl.trim() || null,
        event_description: eventDescription.trim() || null,
      };

      if (existing) {
        const { error } = await supabase.from("profiles").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert(payload);
        if (error) throw error;
      }
      toast.success(existing ? "Perfil atualizado!" : "Perfil publicado!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      if (e.code === "23505") toast.error("Este slug já está em uso");
      else toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const data: ProfileData = {
    name, bio, photo_url: photoPreview, socials, custom_links: customLinks, theme,
    event: {
      show_event: showEvent,
      event_title: eventTitle,
      event_date: eventDate,
      event_time: eventTime,
      event_location: eventLocation,
      event_ticket_url: eventTicketUrl,
      event_description: eventDescription,
    },
  };

  return (
    <main className="px-6 pb-24 max-w-6xl mx-auto grid lg:grid-cols-[1fr_380px] gap-8">
      <div className="space-y-6">
        <Section title="Endereço do perfil" subtitle="Seu link público">
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Slug</div>
            <div className="flex items-stretch rounded-xl bg-input/50 border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
              <span className="px-3 grid place-items-center text-xs text-muted-foreground bg-white/5">/{}</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="seu-nome"
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none font-mono" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5">3-32 caracteres. Apenas letras, números, "-" e "_".</div>
          </label>
        </Section>

        <Section title="Perfil" subtitle="Identidade visual">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Foto</div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border bg-muted grid place-items-center">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
              </div>
              <label className="cursor-pointer px-4 py-2 rounded-xl glass text-sm hover:bg-white/5">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0] || null)} />
                Escolher imagem
              </label>
              {photoPreview && (
                <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="text-xs text-muted-foreground hover:text-destructive">Remover</button>
              )}
            </div>
          </div>
          <Field label="Nome" value={name} onChange={setName} placeholder="Seu nome" />
          <Field label="Bio" value={bio} onChange={setBio} placeholder="Conte algo sobre você" multiline />
        </Section>

        <Section title="Redes sociais" subtitle="Adicione apenas as que você usa">
          <div className="grid sm:grid-cols-2 gap-3">
            {SOCIALS.map((s) => (
              <Field key={s.key} icon={s.icon} label={s.label} value={socials[s.key] || ""}
                onChange={(v) => setSocials((p) => ({ ...p, [s.key]: v }))} placeholder={s.placeholder} />
            ))}
          </div>
        </Section>

        <Section title="Aparência do perfil" subtitle="Escolha o tema visual da sua página pública">
          <div className="grid sm:grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const active = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  className={`theme-${t.key} themed-surface text-left rounded-2xl p-4 border-2 transition focus:outline-none ${active ? "border-primary shadow-[0_0_0_4px_oklch(var(--ring)/0.25)]" : "border-transparent hover:scale-[1.02]"}`}
                  aria-pressed={active}
                >
                  <div className="flex gap-1.5 mb-3">
                    {t.swatch.map((c, i) => (
                      <span key={i} className="w-6 h-6 rounded-full ring-1 ring-white/20" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="font-display font-bold text-sm text-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{t.description}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Agenda" subtitle="Destaque um evento no topo da sua página">
          <label className="flex items-center justify-between gap-3 glass rounded-2xl p-3">
            <div>
              <div className="text-sm font-medium">Exibir card de evento</div>
              <div className="text-[11px] text-muted-foreground">Aparece logo abaixo da sua bio</div>
            </div>
            <input type="checkbox" checked={showEvent} onChange={(e) => setShowEvent(e.target.checked)}
              className="w-5 h-5 accent-primary" />
          </label>

          <Field label="Nome do evento" value={eventTitle} onChange={setEventTitle} placeholder="Show de lançamento" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Data</div>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Hora</div>
              <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
          </div>
          <Field label="Local" value={eventLocation} onChange={setEventLocation} placeholder="Casa de shows, cidade" />
          <Field label="Link para ingressos" value={eventTicketUrl} onChange={setEventTicketUrl} placeholder="https://..." />
          <Field label="Descrição" value={eventDescription} onChange={setEventDescription} placeholder="Detalhes do evento" multiline />
        </Section>


          <div className="space-y-3">
            {customLinks.map((l, i) => (
              <div key={i} className="glass rounded-2xl p-3 grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input className="bg-transparent px-3 py-2 outline-none text-sm" placeholder="Título"
                  value={l.title} onChange={(e) => setCustomLinks((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                <input className="bg-transparent px-3 py-2 outline-none text-sm" placeholder="https://..."
                  value={l.url} onChange={(e) => setCustomLinks((p) => p.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                <button onClick={() => setCustomLinks((p) => p.filter((_, j) => j !== i))}
                  className="w-9 h-9 rounded-lg hover:bg-destructive/20 grid place-items-center text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={() => setCustomLinks((p) => [...p, { title: "", url: "" }])}
              className="w-full glass rounded-2xl py-3 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-white/5">
              <Plus className="w-4 h-4" /> Adicionar link
            </button>
          </div>
        </Section>

        <button onClick={save} disabled={saving}
          className="btn-primary w-full py-4 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : (existing ? "Salvar alterações" : "Publicar perfil")}
        </button>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">Preview ao vivo</div>
        <ProfilePreview data={data} />
      </aside>
    </main>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, placeholder, multiline, icon: Icon }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}{label}
      </div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
      )}
    </label>
  );
}
