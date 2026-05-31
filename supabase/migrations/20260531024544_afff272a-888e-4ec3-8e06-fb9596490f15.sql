
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  photo_url text,
  name text NOT NULL,
  bio text,
  instagram text,
  facebook text,
  tiktok text,
  youtube text,
  linkedin text,
  whatsapp text,
  telegram text,
  twitter text,
  website text,
  custom_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_slug_idx ON public.profiles(slug);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can create profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profile" ON public.profiles FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read profile photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');
CREATE POLICY "Anyone can upload profile photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');
