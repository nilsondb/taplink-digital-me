CREATE OR REPLACE FUNCTION public.recompute_app_metrics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    last_update = now()
  WHERE id IS NOT NULL;
END;
$function$;