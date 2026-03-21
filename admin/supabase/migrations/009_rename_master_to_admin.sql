-- =============================================
-- Migration 009: Rename role 'master' → 'admin'
-- =============================================

-- Update existing master users to admin
UPDATE public.users SET role = 'admin' WHERE role = 'master';

-- Drop old constraint and create new one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'instructor'));
