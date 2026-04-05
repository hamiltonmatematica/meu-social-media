-- # PROTEÇÃO MÁXIMA - ContentPlatformCore
-- Este script implementa a política de segurança de "Proteção Máxima" (Maximum Protection Hardening).
-- Garante que nenhum dado seja exposto publicamente e que todas as interações exijam autenticação rigorosa.

-- 1. Habilitar RLS em todas as tabelas (Existentes e Novas)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. BLOQUEIO TOTAL - Remover qualquer política pública pré-existente (Prevenção de vazamento)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Definição da Tabela de Posts (Core)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'carrossel',
    payload_ai JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Definição da Tabela de Agendamentos (Queue)
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    plataformas TEXT[] NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. POLÍTICAS DE PROTEÇÃO MÁXIMA (Strict Ownership)

-- Posts: Apenas o dono pode ver/editar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own posts') THEN
        CREATE POLICY "Users can only access their own posts"
        ON public.posts
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Agendamentos: Apenas o dono do post pode ver/editar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own scheduled posts') THEN
        CREATE POLICY "Users can only access their own scheduled posts"
        ON public.scheduled_posts
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.posts 
                WHERE posts.id = scheduled_posts.post_id 
                AND posts.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 6. BLOQUEIO DE ANONIMATO (Double-Check)
ALTER TABLE public."posts" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."scheduled_posts" FORCE ROW LEVEL SECURITY;

-- 7. TRIGGER DE UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
