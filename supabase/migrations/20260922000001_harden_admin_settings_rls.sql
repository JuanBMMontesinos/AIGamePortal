-- ==============================================================================
-- PROJETO: Made By AI Games (Fase 4 - Remediação Crítica DevSecOps)
-- MIGRATION: 20260922000001_harden_admin_settings_rls.sql
-- DESCRIÇÃO: Blindagem de Row Level Security (RLS) para discord_settings,
--            newsletter_settings e social_settings. Revoga SELECT de anon/authenticated
--            para proteger webhooks, e-mails de teste e tokens de API, restringindo
--            o acesso a dados sensíveis exclusivamente para service_role.
-- DIALETO: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BLINDAGEM DE DISCORD_SETTINGS (Proteção de Webhook URLs)
-- ------------------------------------------------------------------------------
ALTER TABLE public.discord_settings ENABLE ROW LEVEL SECURITY;

-- 1.1 Revogação da política permissiva anterior que permitia leitura pela role anon
DROP POLICY IF EXISTS "Permitir leitura de settings do discord" ON public.discord_settings;
DROP POLICY IF EXISTS "Permitir leitura de discord_settings apenas para service_role" ON public.discord_settings;

-- 1.2 Nova política estrita: leitura exclusiva para service_role
CREATE POLICY "Permitir leitura de discord_settings apenas para service_role"
    ON public.discord_settings
    FOR SELECT
    TO service_role
    USING (true);

-- ------------------------------------------------------------------------------
-- 2. BLINDAGEM DE NEWSLETTER_SETTINGS (Proteção de E-mails e Logs)
-- ------------------------------------------------------------------------------
ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;

-- 2.1 Revogação da política permissiva anterior que permitia leitura pela role anon
DROP POLICY IF EXISTS "Permitir leitura de settings da newsletter" ON public.newsletter_settings;
DROP POLICY IF EXISTS "Permitir leitura de newsletter_settings apenas para service_role" ON public.newsletter_settings;

-- 2.2 Nova política estrita: leitura exclusiva para service_role
CREATE POLICY "Permitir leitura de newsletter_settings apenas para service_role"
    ON public.newsletter_settings
    FOR SELECT
    TO service_role
    USING (true);

-- ------------------------------------------------------------------------------
-- 3. BLINDAGEM DE SOCIAL_SETTINGS (Proteção de Telemetria e Flags de Redes)
-- ------------------------------------------------------------------------------
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

-- 3.1 Revogação da política permissiva anterior que permitia leitura pela role anon
DROP POLICY IF EXISTS "Permitir leitura de settings de redes sociais" ON public.social_settings;
DROP POLICY IF EXISTS "Permitir leitura de social_settings apenas para service_role" ON public.social_settings;

-- 3.2 Nova política estrita: leitura exclusiva para service_role
CREATE POLICY "Permitir leitura de social_settings apenas para service_role"
    ON public.social_settings
    FOR SELECT
    TO service_role
    USING (true);

-- ------------------------------------------------------------------------------
-- 4. VIEW SEGURA PÚBLICA (Dados Não-Sensíveis da Newsletter)
-- ------------------------------------------------------------------------------
-- Permite que clientes front-end verifiquem se a newsletter está ativa sem expor
-- campos sensíveis como test_recipient_email ou last_dispatch_log.
CREATE OR REPLACE VIEW public.public_newsletter_status AS
SELECT
    id,
    is_enabled,
    sender_name,
    created_at,
    updated_at
FROM public.newsletter_settings;

COMMENT ON VIEW public.public_newsletter_status IS
    'Visão pública sanitizada do status operacional da newsletter sem exposição de dados sensíveis ou destinatários de teste.';

GRANT SELECT ON public.public_newsletter_status TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. RPC DE SEGURANÇA (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
-- Função RPC com privilégio controlado para checagem pontual de status da newsletter
CREATE OR REPLACE FUNCTION public.get_newsletter_public_status()
RETURNS TABLE (
    is_enabled BOOLEAN,
    sender_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        is_enabled,
        sender_name
    FROM public.newsletter_settings
    WHERE id = 'default'
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_newsletter_public_status() IS
    'Função RPC segura para conferir se o serviço de newsletter está operacional sem risco de vazamento de credenciais.';

GRANT EXECUTE ON FUNCTION public.get_newsletter_public_status() TO anon, authenticated, service_role;
