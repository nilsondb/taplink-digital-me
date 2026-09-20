import { useAuth } from "@/lib/auth";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  return {
    isAdmin: user?.role === "admin",
    checking: loading,
  };
}

export type AdminUser = {
  user_id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  user_status: "active" | "inactive";
  profile_id: string | null;
  name: string | null;
  slug: string | null;
  photo_url: string | null;
  status: string | null;
  views_count: number;
  clicks_count: number;
};

export type AdminStats = {
  total_users: number;
  total_profiles: number;
  total_views: number;
  total_clicks: number;
  users_today: number;
  growth: { day: string; count: number }[];
};
