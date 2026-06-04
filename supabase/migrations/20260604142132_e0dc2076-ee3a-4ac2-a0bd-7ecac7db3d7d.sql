-- Ensure there is exactly one integration_settings row with the default token
INSERT INTO public.integration_settings (enabled, integration_token)
SELECT true, 'SC_LINKTAP_2026'
WHERE NOT EXISTS (SELECT 1 FROM public.integration_settings);

UPDATE public.integration_settings
SET integration_token = COALESCE(NULLIF(integration_token, ''), 'SC_LINKTAP_2026'),
    enabled = true
WHERE integration_token IS NULL OR integration_token = '';