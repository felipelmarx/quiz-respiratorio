-- =============================================
-- Security fixes
-- =============================================

-- Remove dangerous anonymous update policy on quiz_responses.
-- The submit endpoint sets lead_id during insert, so anonymous updates are not needed.
-- This policy previously allowed any anonymous user to modify any column on rows with lead_id IS NULL.
DROP POLICY IF EXISTS "anon_update_responses" ON public.quiz_responses;

-- Change resolve_instructor_slug from SECURITY DEFINER to SECURITY INVOKER
-- to reduce privilege escalation surface. The anon role can call this function
-- and the query only reads slug + is_active from public.users.
CREATE OR REPLACE FUNCTION public.resolve_instructor_slug(p_slug TEXT)
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE slug = p_slug AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY INVOKER;

-- Allow anon to read minimal user info needed for slug resolution
DROP POLICY IF EXISTS "anon_read_instructor_slug" ON public.users;
CREATE POLICY "anon_read_instructor_slug" ON public.users
  FOR SELECT USING (role = 'instructor' AND is_active = true);
