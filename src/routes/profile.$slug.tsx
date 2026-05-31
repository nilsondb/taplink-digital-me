import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2, Sparkles, Smartphone, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePreview } from "@/components/ProfilePreview";
import type { CustomLink, SocialKey } from "@/lib/social";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { profile: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.profile ? `${loaderData.profile.name} — TapLink NFC` : "Perfil — TapLink NFC" },
      { name: "description", content: loaderData?.profile?.bio || "Perfil digital compartilhado via TapLink NFC." },
      { property: "og:title", content: loaderData?.profile?.name || "TapLink NFC" },
      { property: "og:description", content: loaderData?.profile?.bio || "Perfil digital TapLink NFC" },
      ...(loaderData?.profile?.photo_url ? [{ property: "og:image", content: loaderData.profile.photo_url }] : []),
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-bold">Algo deu errado</h1><p className="text-muted-foreground mt-2">{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">Perfil não encontrado</h1>
        <p className="text-muted-foreground mt-2">Esse link não existe ou foi removido.</p>
        <Link to="/" className="btn-primary inline-block mt-6 px-6 py-3 rounded-2xl font-semibold">Voltar ao início</Link>
      </div>
    </div>
  ),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const socials: Partial<Record<SocialKey, string>> = {
    instagram: profile.instagram ?? undefined,
    facebook: profile.facebook ?? undefined,
    tiktok: profile.tiktok ?? undefined,
    youtube: profile.youtube ?? undefined,
    linkedin: profile.linkedin ?? undefined,
    whatsapp: profile.whatsapp ?? undefined,
    telegram: profile.telegram ?? undefined,
    twitter: profile.twitter ?? undefined,
    website: profile.website ?? undefined,
  };

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: profile.name, url }); } catch {}
    } else { copy(); }
  }

  function download() {
    const svg = document.getElementById("profile-qr") as unknown as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.slug}-qr.svg`;
    a.click();
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-md mx-auto">
        <ProfilePreview data={{
          name: profile.name, bio: profile.bio ?? "", photo_url: profile.photo_url,
          socials, custom_links: (profile.custom_links as unknown as CustomLink[]) || [],
        }} />

        <div className="mt-8 glass rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Seu link</div>
              <div className="text-sm font-mono truncate">{url}</div>
            </div>
            <button onClick={copy} className="shrink-0 w-10 h-10 rounded-xl btn-primary grid place-items-center">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={() => setShowQR((v) => !v)} className="glass rounded-xl py-3 text-xs inline-flex items-center justify-center gap-1.5 hover:bg-white/5">
              <Sparkles className="w-3.5 h-3.5" /> QR Code
            </button>
            <button onClick={share} className="glass rounded-xl py-3 text-xs inline-flex items-center justify-center gap-1.5 hover:bg-white/5">
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
            <button onClick={download} className="glass rounded-xl py-3 text-xs inline-flex items-center justify-center gap-1.5 hover:bg-white/5">
              <Download className="w-3.5 h-3.5" /> Baixar QR
            </button>
          </div>

          {showQR && (
            <div className="mt-5 grid place-items-center">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG id="profile-qr" value={url} size={220} bgColor="#ffffff" fgColor="#0a0a14" level="H" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 glass rounded-3xl p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl btn-primary grid place-items-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">Pronto para NFC</div>
            <p className="text-sm text-muted-foreground mt-1">
              Utilize esta URL para gravar em qualquer Tag NFC compatível.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/create" className="text-xs text-muted-foreground hover:text-foreground">
            Crie seu próprio TapLink →
          </Link>
        </div>
      </div>
    </div>
  );
}
