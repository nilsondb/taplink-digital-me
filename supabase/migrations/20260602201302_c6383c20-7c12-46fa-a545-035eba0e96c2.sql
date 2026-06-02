
-- ============================
-- integration_settings (singleton row)
-- ============================
CREATE TABLE public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT false,
  saas_center_url TEXT,
  integration_token TEXT,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO authenticated;
GRANT ALL ON public.integration_settings TO service_role;

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integration settings"
ON public.integration_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed single config row
INSERT INTO public.integration_settings (enabled) VALUES (false);

-- ============================
-- app_metrics (singleton row)
-- ============================
CREATE TABLE public.app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  premium_users INTEGER NOT NULL DEFAULT 0,
  total_subscriptions INTEGER NOT NULL DEFAULT 0,
  monthly_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  annual_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_users_today INTEGER NOT NULL DEFAULT 0,
  new_users_month INTEGER NOT NULL DEFAULT 0,
  cancellations_month INTEGER NOT NULL DEFAULT 0,
  custom_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_update TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_metrics TO authenticated;
GRANT ALL ON public.app_metrics TO service_role;

ALTER TABLE public.app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read metrics"
ON public.app_metrics
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_metrics DEFAULT VALUES;

-- ============================
-- saas_center_sync_log
-- ============================
CREATE TABLE public.saas_center_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.saas_center_sync_log TO authenticated;
GRANT ALL ON public.saas_center_sync_log TO service_role;

ALTER TABLE public.saas_center_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sync log"
ON public.saas_center_sync_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert sync log"
ON public.saas_center_sync_log
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================
-- Recompute function + triggers
-- ============================
CREATE OR REPLACE FUNCTION public.recompute_app_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users INT;
  v_active_users INT;
  v_new_today INT;
  v_new_month INT;
BEGIN
  SELECT count(*) INTO v_total_users FROM auth.users;
  SELECT count(*) INTO v_active_users FROM public.profiles WHERE status = 'active';
  SELECT count(*) INTO v_new_today FROM auth.users WHERE created_at >= date_trunc('day', now());
  SELECT count(*) INTO v_new_month FROM auth.users WHERE created_at >= date_trunc('month', now());

  UPDATE public.app_metrics SET
    total_users = v_total_users,
    active_users = v_active_users,
    new_users_today = v_new_today,
    new_users_month = v_new_month,
    last_update = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_app_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_app_metrics();
  RETURN NULL;
END;
$$;

-- Triggers: new/deleted users (auth.users), and profile status changes
CREATE TRIGGER app_metrics_on_user_change
AFTER INSERT OR DELETE ON auth.users
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recompute_app_metrics();

CREATE TRIGGER app_metrics_on_profile_change
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recompute_app_metrics();

-- Initial compute
SELECT public.recompute_app_metrics();
