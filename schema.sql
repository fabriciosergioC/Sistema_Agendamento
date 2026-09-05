-- Script de Criação de Tabelas para o Supabase
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com)

-- 1. Tabela de Agendamentos (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    service TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CORREÇÃO: Remover restrição NOT NULL de colunas opcionais (caso a tabela já exista com restrição errada)
ALTER TABLE public.appointments ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Tabela de Administradores (admins)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inserir administrador padrão (se não existir)
INSERT INTO public.admins (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- 4. Habilitar Row Level Security (RLS) e liberar permissões de leitura/escrita pública
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Políticas para appointments
DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos" ON public.appointments;
CREATE POLICY "Permitir leitura pública de agendamentos" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON public.appointments;
CREATE POLICY "Permitir inserção pública de agendamentos" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública de agendamentos" ON public.appointments;
CREATE POLICY "Permitir atualização pública de agendamentos" ON public.appointments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão pública de agendamentos" ON public.appointments;
CREATE POLICY "Permitir exclusão pública de agendamentos" ON public.appointments FOR DELETE USING (true);

-- Políticas para admins
DROP POLICY IF EXISTS "Permitir leitura pública de admins" ON public.admins;
CREATE POLICY "Permitir leitura pública de admins" ON public.admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública de admins" ON public.admins;
CREATE POLICY "Permitir inserção pública de admins" ON public.admins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão pública de admins" ON public.admins;
CREATE POLICY "Permitir exclusão pública de admins" ON public.admins FOR DELETE USING (true);
