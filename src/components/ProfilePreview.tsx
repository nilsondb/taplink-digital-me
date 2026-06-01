import { User } from "lucide-react";
import { SOCIALS, type CustomLink, type SocialKey } from "@/lib/social";
import { themeClass, type ThemeKey } from "@/lib/themes";

export type ProfileData = {
  name: string;
  bio: string;
  photo_url: string | null;
  socials: Partial<Record<SocialKey, string>>;
  custom_links: CustomLink[];
  theme?: ThemeKey;
};

export function ProfilePreview({ data }: { data: ProfileData }) {
  return (
    <div className={`${themeClass(data.theme)} themed-surface rounded-3xl p-4`}>
    <div className="w-full max-w-sm mx-auto glass rounded-3xl p-7 text-center">

      <div className="w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-primary/30 bg-muted grid place-items-center">
        {data.photo_url ? (
          <img src={data.photo_url} alt={data.name || "Foto"} className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">{data.name || "Seu nome"}</h2>
      {data.bio && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{data.bio}</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SOCIALS.filter((s) => data.socials[s.key]?.trim()).map((s) => {
          const Icon = s.icon;
          return (
            <a key={s.key} href={s.href(data.socials[s.key]!)} target="_blank" rel="noreferrer"
              className="w-11 h-11 rounded-full glass grid place-items-center hover:scale-110 transition">
              <Icon className="w-5 h-5" />
            </a>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {data.custom_links.filter((l) => l.title && l.url).map((l, i) => (
          <a key={i} href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noreferrer"
            className="block w-full px-5 py-4 rounded-2xl glass font-medium hover:translate-y-[-2px] hover:shadow-[0_15px_40px_-15px_oklch(0.65_0.22_320/0.4)] transition">
            {l.title}
          </a>
        ))}
      </div>

      <div className="mt-8 text-[10px] uppercase tracking-widest text-muted-foreground">TapLink NFC</div>
    </div>
  );
}
