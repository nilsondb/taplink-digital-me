import { db } from "./db";
import type { LocalProfile } from "@/lib/local-types";

function safeLinks(value: unknown): Array<{ title: string; url: string }> {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        title: String((item as { title?: unknown }).title || "").slice(0, 120),
        url: String((item as { url?: unknown }).url || "").slice(0, 2000),
      }))
      .filter((item) => item.title && item.url);
  }

  if (typeof value === "string") {
    try {
      return safeLinks(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
}

export function mapProfile(row: Record<string, unknown>): LocalProfile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    slug: String(row.slug),
    name: String(row.name),
    bio: row.bio == null ? null : String(row.bio),
    photo_url: row.photo_url == null ? null : String(row.photo_url),
    instagram: row.instagram == null ? null : String(row.instagram),
    facebook: row.facebook == null ? null : String(row.facebook),
    tiktok: row.tiktok == null ? null : String(row.tiktok),
    youtube: row.youtube == null ? null : String(row.youtube),
    linkedin: row.linkedin == null ? null : String(row.linkedin),
    whatsapp: row.whatsapp == null ? null : String(row.whatsapp),
    telegram: row.telegram == null ? null : String(row.telegram),
    twitter: row.twitter == null ? null : String(row.twitter),
    website: row.website == null ? null : String(row.website),
    custom_links: safeLinks(row.custom_links),
    theme: String(row.theme || "neon-dark"),
    show_event: Boolean(row.show_event),
    event_title: row.event_title == null ? null : String(row.event_title),
    event_date: row.event_date == null ? null : String(row.event_date),
    event_time: row.event_time == null ? null : String(row.event_time),
    event_location: row.event_location == null ? null : String(row.event_location),
    event_ticket_url: row.event_ticket_url == null ? null : String(row.event_ticket_url),
    event_description: row.event_description == null ? null : String(row.event_description),
    views_count: Number(row.views_count || 0),
    clicks_count: Number(row.clicks_count || 0),
    status: row.status === "inactive" ? "inactive" : "active",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function getProfileByUserId(userId: string) {
  const row = db.prepare("SELECT * FROM profiles WHERE user_id = ? LIMIT 1").get(userId) as Record<string, unknown> | undefined;
  return row ? mapProfile(row) : null;
}

export function getPublicProfileBySlug(slug: string) {
  const row = db.prepare(`
    SELECT * FROM profiles
    WHERE slug = ? COLLATE NOCASE AND status = 'active'
    LIMIT 1
  `).get(slug) as Record<string, unknown> | undefined;
  return row ? mapProfile(row) : null;
}

export function getPlatformMetrics() {
  const totalUsers = Number((db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n || 0);
  const activeUsers = Number((db.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'active'").get() as { n: number }).n || 0);
  const totalProfiles = Number((db.prepare("SELECT COUNT(*) AS n FROM profiles").get() as { n: number }).n || 0);
  const totalViews = Number((db.prepare("SELECT COALESCE(SUM(views_count), 0) AS n FROM profiles").get() as { n: number }).n || 0);
  const totalClicks = Number((db.prepare("SELECT COALESCE(SUM(clicks_count), 0) AS n FROM profiles").get() as { n: number }).n || 0);
  const newUsersToday = Number((db.prepare("SELECT COUNT(*) AS n FROM users WHERE date(created_at) = date('now')").get() as { n: number }).n || 0);
  const newUsersMonth = Number((db.prepare("SELECT COUNT(*) AS n FROM users WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").get() as { n: number }).n || 0);

  let activeLinks = 0;
  const rows = db.prepare("SELECT custom_links FROM profiles WHERE status = 'active'").all() as Array<{ custom_links: string }>;
  for (const row of rows) activeLinks += safeLinks(row.custom_links).length;

  return {
    totalUsers,
    activeUsers,
    totalProfiles,
    totalViews,
    totalClicks,
    newUsersToday,
    newUsersMonth,
    activeLinks,
  };
}
