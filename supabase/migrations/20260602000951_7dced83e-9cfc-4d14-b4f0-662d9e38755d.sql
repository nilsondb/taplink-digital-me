ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_event boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_title text,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_time time,
  ADD COLUMN IF NOT EXISTS event_location text,
  ADD COLUMN IF NOT EXISTS event_ticket_url text,
  ADD COLUMN IF NOT EXISTS event_description text;

UPDATE auth.users
SET encrypted_password = crypt('nilson10@', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE lower(email) = 'admin@taplinknfc.com';
