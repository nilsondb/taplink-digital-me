import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SOCIALS, generateSlug, type CustomLink, type SocialKey } from "@/lib/social";
import { ProfilePreview, type ProfileData } from "@/components/ProfilePreview";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Criar perfil — TapLink NFC" },
      { name: "description", content: "Monte seu perfil digital em segundos." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [socials, setSocials] = useState<Partial<Record<SocialKey, string>>>({});
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(false);

  const data: ProfileData = { name, bio, photo_url: photoPreview, socials, custom_links: customLinks };

  function handlePhoto(file: File | null) {
    setPhotoFile(file);
    if (!file) { setPhotoPreview(null); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function publish() {
    if (!name.trim()) { toast.error("Adicione seu nome"); return; }
    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, photoFile, {
          cacheControl: "3600", upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }

      let slug = generateSlug(name);
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase.from("profiles").select("id").eq("slug", slug).maybeSingle();
        if (!existing) break;
        slug = generateSlug(name);
      }

      const cleanedLinks = customLinks.filter((l) => l.title.trim() && l.url.trim());
      const payload = {
        slug, name: name.trim(), bio: bio.trim() || null, photo_url: photoUrl,
        instagram: socials.instagram || null, facebook: socials.facebook || null,
        tiktok: socials.tiktok || null, youtube: socials.youtube || null,
        linkedin: socials.linkedin || null, whatsapp: socials.whatsapp || null,
        telegram: socials.telegram || null, twitter: socials.twitter || null,
        website: socials.website || null, custom_links: cleanedLinks,
      };

      const { error } = await supabase.from("profiles").insert(payload);
      if (error) throw error;

      toast.success("Perfil publicado!");
      navigate({ to: "/profile/$slug", params: { slug } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="px-6 py-6 max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-primary grid place-items-center"><Sparkles className="w-4 h-4" /></div>
          <span className="font-display font-bold">TapLink<span className="gradient-text">NFC</span></span>
        </div>
      </header>

      <main className="px-6 pb-24 max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-8">
          {/* Profile */}
          <Section title="Perfil" subtitle="Identidade básica do seu link">
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground mb-2">Foto</div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border bg-muted grid place-items-center">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                </div>
                <label className="cursor-pointer px-4 py-2 rounded-xl glass text-sm hover:bg-white/5">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0] || null)} />
                  Escolher imagem
                </label>
                {photoFile && (
                  <button onClick={() => handlePhoto(null)} className="text-xs text-muted-foreground hover:text-destructive">Remover</button>
                )}
              </div>
            </label>
            <Field label="Nome" value={name} onChange={setName} placeholder="Seu nome" />
            <Field label="Bio" value={bio} onChange={setBio} placeholder="Conte algo sobre você" multiline />
          </Section>

          {/* Socials */}
          <Section title="Redes sociais" subtitle="Adicione apenas as que você usa">
            <div className="grid sm:grid-cols-2 gap-3">
              {SOCIALS.map((s) => (
                <Field key={s.key} icon={s.icon} label={s.label} value={socials[s.key] || ""}
                  onChange={(v) => setSocials((p) => ({ ...p, [s.key]: v }))} placeholder={s.placeholder} />
              ))}
            </div>
          </Section>

          {/* Custom Links */}
          <Section title="Links personalizados" subtitle="Botões extras para qualquer URL">
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
                <Plus className="w-4 h-4" /> Adicionar Link
              </button>
            </div>
          </Section>

          <button onClick={publish} disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</> : "Publicar Perfil"}
          </button>
        </div>

        {/* Preview */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">Preview ao vivo</div>
          <ProfilePreview data={data} />
        </aside>
      </main>
    </div>
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
