import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { setIsAdmin(false); setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, loading]);

  return { isAdmin, checking: checking || loading };
}

export type AdminUser = {
  user_id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
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
  total_links: number;
  users_today: number;
  growth: { day: string; count: number }[];
};
