-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 2 - Fact-Checking & Classificação de Confiabilidade)
-- DESCRIÇÃO: Adiciona colunas para mitigação de fake news, detecção de rumores
--            e mensuração de confiabilidade de fontes jornalísticas.
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Execute este script no SQL Editor do Supabase para atualizar a tabela 'posts'.
-- ==============================================================================

-- 1. ADIÇÃO DE COLUNAS DE FACT-CHECKING NA TABELA POSTS
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_rumor BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reliability_score INTEGER NOT NULL DEFAULT 5 CHECK (reliability_score >= 1 AND reliability_score <= 5),
ADD COLUMN IF NOT EXISTS rumor_warning TEXT;

-- 2. DOCUMENTAÇÃO E COMENTÁRIOS DAS NOVAS COLUNAS
COMMENT ON COLUMN public.posts.is_rumor IS 
    'Sinalizador booleano que indica se a matéria é baseada em boatos, vazamentos, patentes ou fontes não oficiais.';

COMMENT ON COLUMN public.posts.reliability_score IS 
    'Escala de confiabilidade de 1 a 5 da informação: 5 = Anúncio/Press Release Oficial, 4 = Investigação Jornalística Multicomprovada, 3 = Patente/Registro em Órgão Regulador, 2 = Datamine/Leaker Conhecido, 1 = Fórum Anônimo/Boato não verificado.';

COMMENT ON COLUMN public.posts.rumor_warning IS 
    'Aviso explicativo e contextual gerado pelo agente de IA detalhando a natureza preliminar ou incerta do rumor.';

-- 3. ÍNDICE PARA FILTRAGEM RÁPIDA DE RUMORES
CREATE INDEX IF NOT EXISTS idx_posts_is_rumor 
    ON public.posts(is_rumor);

CREATE INDEX IF NOT EXISTS idx_posts_reliability_score 
    ON public.posts(reliability_score);
