export type LocalUser = {
  id: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  created_at: string;
};

export type LocalProfile = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  telegram: string | null;
  twitter: string | null;
  website: string | null;
  custom_links: Array<{ title: string; url: string }>;
  theme: string;
  show_event: boolean;
  event_title: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  event_ticket_url: string | null;
  event_description: string | null;
  views_count: number;
  clicks_count: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};
