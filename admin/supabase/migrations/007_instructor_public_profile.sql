-- =============================================
-- Migration 007: Public instructor profile lookup
-- =============================================
-- RPC function for the static quiz to resolve an instructor slug
-- into their public profile data + ID, in a single call.
-- Uses SECURITY INVOKER — anon can already read active instructors
-- via the "anon_read_instructor_slug" RLS policy from migration 004.

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
