-- =============================================
-- Migration 008: License expiration for instructors
-- =============================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.license_expires_at IS 'Data de expiração da licença do instrutor. NULL = sem expiração.';
