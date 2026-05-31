
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

TRUNCATE public.profiles;

ALTER TABLE public.profiles
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN clicks_count integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX profiles_user_id_unique ON public.profiles(user_id);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_slug_key;
CREATE UNIQUE INDEX profiles_slug_lower_unique ON public.profiles(lower(slug));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_slug_format CHECK (slug ~ '^[a-zA-Z0-9_-]{3,32}$');

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Public can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent text
);
CREATE INDEX profile_views_profile_id_idx ON public.profile_views(profile_id, viewed_at DESC);
GRANT INSERT ON public.profile_views TO anon, authenticated;
GRANT SELECT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert view" ON public.profile_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner reads own views" ON public.profile_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

CREATE TABLE public.link_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  link_type text NOT NULL,
  link_key text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX link_clicks_profile_id_idx ON public.link_clicks(profile_id, clicked_at DESC);
GRANT INSERT ON public.link_clicks TO anon, authenticated;
GRANT SELECT ON public.link_clicks TO authenticated;
GRANT ALL ON public.link_clicks TO service_role;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert click" ON public.link_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner reads own clicks" ON public.link_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.profiles SET views_count = views_count + 1 WHERE id = NEW.profile_id; RETURN NEW; END; $$;

CREATE TRIGGER trg_increment_view_count AFTER INSERT ON public.profile_views
  FOR EACH ROW EXECUTE FUNCTION public.increment_view_count();

CREATE OR REPLACE FUNCTION public.increment_click_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.profiles SET clicks_count = clicks_count + 1 WHERE id = NEW.profile_id; RETURN NEW; END; $$;

CREATE TRIGGER trg_increment_click_count AFTER INSERT ON public.link_clicks
  FOR EACH ROW EXECUTE FUNCTION public.increment_click_count();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
