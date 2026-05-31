import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BarChart3, Eye, MousePointerClick, Copy, Check, ExternalLink, Pencil, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TapLink NFC" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (!profile) {
    return (
      <main className="px-6 py-10 max-w-3xl mx-auto">
        <div className="glass rounded-3xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl btn-primary grid place-items-center mx-auto mb-4"><Sparkles className="w-6 h-6" /></div>
          <h1 className="font-display font-bold text-2xl">Crie seu perfil TapLink</h1>
          <p className="text-muted-foreground mt-2">Configure seu slug, foto, bio e links em uma página.</p>
          <Link to="/edit" className="btn-primary inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl font-semibold">
            Começar <Pencil className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/${profile.slug}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true); toast.success("Link copiado");
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="px-6 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl">Olá, {profile.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu TapLink</p>
        </div>
        <Link to="/edit" className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
          <Pencil className="w-4 h-4" /> Editar perfil
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard icon={Eye} label="Visualizações" value={profile.views_count} accent />
        <StatCard icon={MousePointerClick} label="Cliques em links" value={profile.clicks_count} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Seu link público</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="text-lg font-mono truncate flex-1">{url}</code>
            <button onClick={copy} className="w-10 h-10 rounded-xl btn-primary grid place-items-center shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl glass grid place-items-center shrink-0">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-6 glass rounded-2xl p-5 flex items-start gap-4">
            <BarChart3 className="w-6 h-6 text-primary shrink-0" />
            <div className="text-sm">
              <div className="font-semibold">Estrutura pronta para NFC</div>
              <div className="text-muted-foreground mt-1">
                Use a URL acima para gravar em qualquer Tag NFC compatível. Toda visita registra uma estatística em tempo real.
              </div>
            </div>
          </div>
        </div>
        <div className="glass rounded-3xl p-6 text-center">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">QR Code</div>
          <div className="bg-white p-3 rounded-2xl inline-block">
            <QRCodeSVG value={url} size={180} bgColor="#ffffff" fgColor="#0a0a14" level="H" />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass rounded-3xl p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl grid place-items-center ${accent ? "btn-primary" : "bg-white/5"}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-display font-bold text-3xl mt-0.5">{value.toLocaleString("pt-BR")}</div>
      </div>
    </div>
  );
}
