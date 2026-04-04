-- =============================================
-- Migration 013: Instructor stats tracking
-- =============================================

-- 1. Add last_login_at column to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.last_login_at IS 'Última vez que o usuário fez login.';

-- 2. Function to update last_login_at after successful auth
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.update_last_login() IS 'Atualiza last_login_at do usuário autenticado.';

-- 3. Function to get aggregated instructor stats
CREATE OR REPLACE FUNCTION public.get_instructor_stats()
RETURNS TABLE (
  instructor_id UUID,
  name TEXT,
  email TEXT,
  slug TEXT,
  response_count BIGINT,
  lead_count BIGINT,
  avg_score NUMERIC,
  last_response_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN,
  license_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS instructor_id,
    u.name,
    u.email,
    u.slug,
    COALESCE(r.response_count, 0) AS response_count,
    COALESCE(l.lead_count, 0) AS lead_count,
    ROUND(r.avg_score, 2) AS avg_score,
    r.last_response_at,
    u.last_login_at,
    u.is_active,
    u.license_expires_at
  FROM public.users u
  LEFT JOIN (
    SELECT
      qr.instructor_id,
      COUNT(*) AS response_count,
      AVG(qr.total_score) AS avg_score,
      MAX(qr.created_at) AS last_response_at
    FROM public.quiz_responses qr
    GROUP BY qr.instructor_id
  ) r ON r.instructor_id = u.id
  LEFT JOIN (
    SELECT
      ql.instructor_id,
      COUNT(*) AS lead_count
    FROM public.quiz_leads ql
    GROUP BY ql.instructor_id
  ) l ON l.instructor_id = u.id
  WHERE u.role = 'instructor'
  ORDER BY response_count DESC;
END;
$$;

COMMENT ON FUNCTION public.get_instructor_stats() IS 'Retorna estatísticas agregadas de todos os instrutores.';
