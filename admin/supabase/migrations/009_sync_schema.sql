-- =============================================
-- Migration 009: Sync schema with application code
-- =============================================
-- The users table has columns from an older project (carousel).
-- This migration adds missing columns required by the quiz app.

-- 1. Add missing columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"view_dashboard":true,"view_responses":true,"view_contacts":true,"export_data":false,"manage_settings":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ;

-- 2. Backfill: map is_whitelisted → is_active for existing users
UPDATE public.users SET is_active = is_whitelisted WHERE is_active IS NULL OR is_active != is_whitelisted;

-- 3. Backfill: generate slug from name for existing users that don't have one
UPDATE public.users
SET slug = lower(regexp_replace(
  regexp_replace(
    translate(name, 'áàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ', 'aaaaeeiooouucAAAAEEIOOOUUC'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ),
  '^-|-$', '', 'g'
))
WHERE slug IS NULL AND name IS NOT NULL;

-- 4. Create invite_tokens table
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_active
  ON public.invite_tokens (token) WHERE is_active = true;

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invite_tokens' AND policyname = 'Master can manage invite tokens'
  ) THEN
    CREATE POLICY "Master can manage invite tokens"
      ON public.invite_tokens
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'master'
        )
      );
  END IF;
END $$;

-- 5. Create instructor public profile RPC
CREATE OR REPLACE FUNCTION public.get_instructor_by_slug(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'profissao', profissao,
    'cidade', cidade,
    'nome_clinica', nome_clinica,
    'whatsapp', whatsapp
  )
  FROM public.users
  WHERE slug = p_slug AND is_active = true AND role = 'instructor'
  LIMIT 1;
$$ LANGUAGE sql SECURITY INVOKER;

-- 6. Add RLS policy for anon to read active instructors by slug (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'anon_read_instructor_slug'
  ) THEN
    CREATE POLICY "anon_read_instructor_slug"
      ON public.users
      FOR SELECT
      USING (role = 'instructor' AND is_active = true);
  END IF;
END $$;

-- Done. Verify:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
