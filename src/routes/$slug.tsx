import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SOCIALS, type CustomLink, type SocialKey } from "@/lib/social";
import { themeClass } from "@/lib/themes";
import { EventCard } from "@/components/EventCard";


export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,slug,name,bio,photo_url,theme,instagram,facebook,tiktok,youtube,linkedin,whatsapp,telegram,twitter,website,custom_links,show_event,event_title,event_date,event_time,event_location,event_ticket_url,event_description")
      .ilike("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { profile: data };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    return {
      meta: [
        { title: p ? `${p.name} — TapLink NFC` : "Perfil — TapLink NFC" },
        { name: "description", content: p?.bio || `Perfil de ${p?.name} no TapLink NFC` },
        { property: "og:title", content: p?.name || "TapLink NFC" },
        { property: "og:description", content: p?.bio || "Perfil digital" },
        ...(p?.photo_url ? [{ property: "og:image", content: p.photo_url }] : []),
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Algo deu errado</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">Perfil não encontrado</h1>
        <p className="text-muted-foreground mt-2">Este link não existe ou foi removido.</p>
        <Link to="/" className="btn-primary inline-block mt-6 px-6 py-3 rounded-2xl font-semibold">Voltar ao início</Link>
      </div>
    </div>
  ),
  component: PublicProfile,
});

function PublicProfile() {
  const { profile } = Route.useLoaderData();

  // Track view (once per session per profile)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `tlview-${profile.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.from("profile_views").insert({
      profile_id: profile.id,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent.slice(0, 256),
    }).then(() => {});
  }, [profile.id]);

  function trackClick(type: "social" | "custom", key: string) {
    supabase.from("link_clicks").insert({ profile_id: profile.id, link_type: type, link_key: key.slice(0, 200) }).then(() => {});
  }

  const socials: Partial<Record<SocialKey, string>> = {
    instagram: profile.instagram ?? undefined, facebook: profile.facebook ?? undefined,
    tiktok: profile.tiktok ?? undefined, youtube: profile.youtube ?? undefined,
    linkedin: profile.linkedin ?? undefined, whatsapp: profile.whatsapp ?? undefined,
    telegram: profile.telegram ?? undefined, twitter: profile.twitter ?? undefined,
    website: profile.website ?? undefined,
  };
  const customLinks = ((profile.custom_links as unknown) as CustomLink[]) || [];

  return (
    <div className={`${themeClass((profile as { theme?: string }).theme)} themed-surface min-h-screen px-6 py-12`}>
      <div className="w-full max-w-md mx-auto glass rounded-3xl p-7 text-center">

        <div className="w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-primary/30 bg-muted grid place-items-center">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">{profile.name}</h1>
        {profile.bio && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>}

        <EventCard
          event={{
            show_event: (profile as { show_event?: boolean }).show_event,
            event_title: (profile as { event_title?: string }).event_title,
            event_date: (profile as { event_date?: string }).event_date,
            event_time: (profile as { event_time?: string }).event_time,
            event_location: (profile as { event_location?: string }).event_location,
            event_ticket_url: (profile as { event_ticket_url?: string }).event_ticket_url,
            event_description: (profile as { event_description?: string }).event_description,
          }}
          onTicketClick={() => trackClick("custom", "event_ticket")}
        />

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SOCIALS.filter((s) => socials[s.key]?.trim()).map((s) => {
            const Icon = s.icon;
            return (
              <a key={s.key} href={s.href(socials[s.key]!)} target="_blank" rel="noreferrer"
                onClick={() => trackClick("social", s.key)}
                className="w-11 h-11 rounded-full glass grid place-items-center hover:scale-110 transition">
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {customLinks.filter((l) => l.title && l.url).map((l, i) => (
            <a key={i} href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noreferrer"
              onClick={() => trackClick("custom", l.title)}
              className="block w-full px-5 py-4 rounded-2xl glass font-medium hover:translate-y-[-2px] hover:shadow-[0_15px_40px_-15px_oklch(0.65_0.22_320/0.4)] transition">
              {l.title}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          Criado com TapLink NFC →
        </Link>
      </div>
    </div>
  );
}
