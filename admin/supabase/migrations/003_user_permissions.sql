-- =============================================
-- Granular permissions for instructors
-- =============================================

-- Add permissions JSONB column to users table
-- Master users ignore this (they have full access)
-- Default: all permissions enabled for new instructors
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{
    "view_dashboard": true,
    "view_responses": true,
    "view_contacts": true,
    "export_data": true,
    "manage_settings": true
  }'::jsonb;

-- Index for permission queries
CREATE INDEX IF NOT EXISTS idx_users_permissions ON public.users USING gin(permissions);
