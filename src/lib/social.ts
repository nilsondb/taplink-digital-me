import { Instagram, Facebook, Youtube, Linkedin, Twitter, Globe, Music2, Send, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CustomLink = { title: string; url: string };

export type SocialKey =
  | "instagram" | "facebook" | "tiktok" | "youtube"
  | "linkedin" | "whatsapp" | "telegram" | "twitter" | "website";

export const SOCIALS: { key: SocialKey; label: string; icon: LucideIcon; placeholder: string; href: (v: string) => string }[] = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "@seuusuario", href: (v) => `https://instagram.com/${v.replace(/^@/, "")}` },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/voce", href: (v) => v.startsWith("http") ? v : `https://facebook.com/${v}` },
  { key: "tiktok", label: "TikTok", icon: Music2, placeholder: "@seuusuario", href: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}` },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "@canal ou URL", href: (v) => v.startsWith("http") ? v : `https://youtube.com/${v.startsWith("@") ? v : "@" + v}` },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "in/seuusuario", href: (v) => v.startsWith("http") ? v : `https://linkedin.com/${v.startsWith("in/") ? v : "in/" + v}` },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "+55 11 99999-9999", href: (v) => `https://wa.me/${v.replace(/\D/g, "")}` },
  { key: "telegram", label: "Telegram", icon: Send, placeholder: "@seuusuario", href: (v) => `https://t.me/${v.replace(/^@/, "")}` },
  { key: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "@seuusuario", href: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  { key: "website", label: "Website", icon: Globe, placeholder: "https://seusite.com", href: (v) => v.startsWith("http") ? v : `https://${v}` },
];

export function sanitizeSlug(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export const SLUG_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

// Reserved slugs that conflict with app routes
export const RESERVED_SLUGS = new Set([
  "login", "signup", "logout", "forgot-password", "reset-password",
  "dashboard", "edit", "api", "admin", "auth", "settings", "_authenticated",
]);
