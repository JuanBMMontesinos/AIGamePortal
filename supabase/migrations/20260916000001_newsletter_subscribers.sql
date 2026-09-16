-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 3 - Módulo de Newsletter Automática)
-- DESCRIÇÃO: Tabela de assinantes de newsletter, índices de performance e RLS
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE ASSINANTES DA NEWSLETTER
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unsubscribed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.newsletter_subscribers IS 'Base de assinantes para o disparo semanal de resumos gamer e ofertas com Resend';
COMMENT ON COLUMN public.newsletter_subscribers.id IS 'Identificador único do assinante';
COMMENT ON COLUMN public.newsletter_subscribers.email IS 'Endereço de e-mail do assinante (único e normalizado)';
COMMENT ON COLUMN public.newsletter_subscribers.is_active IS 'Status da inscrição (true = ativo, false = cancelado/descadastrado)';
COMMENT ON COLUMN public.newsletter_subscribers.subscribed_at IS 'Data/hora em que a inscrição foi confirmada';
COMMENT ON COLUMN public.newsletter_subscribers.unsubscribed_at IS 'Data/hora em que o cancelamento (unsubscribe) foi solicitado';

-- 2. ÍNDICES DE ALTA PERFORMANCE
-- Busca rápida e normalizada por e-mail em minúsculas
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_email_lower
    ON public.newsletter_subscribers (lower(trim(email)));

-- Filtro rápido de inscritos ativos para os disparos semanais
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active
    ON public.newsletter_subscribers (is_active)
    WHERE is_active = true;

-- 3. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 3.1 Permitir que a API pública (anon / authenticated) inscreva novos e-mails
DROP POLICY IF EXISTS "Permitir inscricao publica na newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Permitir inscricao publica na newsletter"
    ON public.newsletter_subscribers
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 3.2 Proibir leitura pública para proteger a privacidade dos inscritos (apenas service_role pode ler a lista)
DROP POLICY IF EXISTS "Permitir leitura apenas para service_role" ON public.newsletter_subscribers;
CREATE POLICY "Permitir leitura apenas para service_role"
    ON public.newsletter_subscribers
    FOR SELECT
    TO service_role
    USING (true);

-- 3.3 Permitir atualização/gerenciamento total apenas para service_role (scripts e rotas de unsubscribe seguras)
DROP POLICY IF EXISTS "Permitir gerenciamento total apenas para service_role" ON public.newsletter_subscribers;
CREATE POLICY "Permitir gerenciamento total apenas para service_role"
    ON public.newsletter_subscribers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
