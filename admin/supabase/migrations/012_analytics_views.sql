-- =============================================
-- Migration 012: Analytics Database Functions
-- Efficient server-side analytics queries for
-- both instructor and admin dashboards.
-- =============================================

-- 1. get_daily_response_counts
-- Returns daily response counts within a date range.
-- Uses generate_series to fill missing dates with 0.
-- Filters by instructor if p_instructor_id is provided.
CREATE OR REPLACE FUNCTION public.get_daily_response_counts(
  p_start_date DATE,
  p_end_date DATE,
  p_instructor_id UUID DEFAULT NULL
)
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.date,
    COALESCE(r.cnt, 0) AS count
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d(date)
  LEFT JOIN (
    SELECT
      (qr.created_at AT TIME ZONE 'UTC')::date AS response_date,
      COUNT(*) AS cnt
    FROM quiz_responses qr
    WHERE (qr.created_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date AND p_end_date
      AND (p_instructor_id IS NULL OR qr.instructor_id = p_instructor_id)
    GROUP BY response_date
  ) r ON d.date::date = r.response_date
  ORDER BY d.date;
$$;

COMMENT ON FUNCTION public.get_daily_response_counts IS
  'Returns daily quiz response counts within a date range, filling gaps with zero. Optionally filtered by instructor.';


-- 2. get_score_distribution
-- Groups total_score into buckets of 5 (0-5, 6-10, ...).
-- Filters by instructor if provided.
CREATE OR REPLACE FUNCTION public.get_score_distribution(
  p_instructor_id UUID DEFAULT NULL
)
RETURNS TABLE(score_bucket TEXT, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH buckets AS (
    SELECT
      generate_series AS bucket_start,
      generate_series + 5 AS bucket_end
    FROM generate_series(0, 50, 6)
  ),
  scored AS (
    SELECT
      CASE
        WHEN total_score <= 5  THEN '0-5'
        WHEN total_score <= 10 THEN '6-10'
        WHEN total_score <= 15 THEN '11-15'
        WHEN total_score <= 20 THEN '16-20'
        WHEN total_score <= 25 THEN '21-25'
        WHEN total_score <= 30 THEN '26-30'
        WHEN total_score <= 35 THEN '31-35'
        WHEN total_score <= 40 THEN '36-40'
        WHEN total_score <= 45 THEN '41-45'
        ELSE '46+'
      END AS score_bucket,
      id
    FROM quiz_responses
    WHERE p_instructor_id IS NULL OR instructor_id = p_instructor_id
  )
  SELECT
    b.label AS score_bucket,
    COALESCE(s.cnt, 0) AS count
  FROM (
    VALUES
      (1, '0-5'),
      (2, '6-10'),
      (3, '11-15'),
      (4, '16-20'),
      (5, '21-25'),
      (6, '26-30'),
      (7, '31-35'),
      (8, '36-40'),
      (9, '41-45'),
      (10, '46+')
  ) AS b(sort_order, label)
  LEFT JOIN (
    SELECT score_bucket, COUNT(*) AS cnt
    FROM scored
    GROUP BY score_bucket
  ) s ON b.label = s.score_bucket
  ORDER BY b.sort_order;
$$;

COMMENT ON FUNCTION public.get_score_distribution IS
  'Returns quiz score distribution grouped in buckets of 5. Optionally filtered by instructor.';


-- 3. get_profile_distribution
-- Groups responses by profile and calculates percentage.
-- Filters by instructor if provided.
CREATE OR REPLACE FUNCTION public.get_profile_distribution(
  p_instructor_id UUID DEFAULT NULL
)
RETURNS TABLE(profile TEXT, count BIGINT, percentage NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT
      qr.profile,
      COUNT(*) AS cnt
    FROM quiz_responses qr
    WHERE p_instructor_id IS NULL OR qr.instructor_id = p_instructor_id
    GROUP BY qr.profile
  ),
  total AS (
    SELECT COALESCE(SUM(cnt), 0) AS total_count FROM counts
  )
  SELECT
    p.profile,
    COALESCE(c.cnt, 0) AS count,
    CASE
      WHEN t.total_count = 0 THEN 0
      ELSE ROUND((COALESCE(c.cnt, 0)::numeric / t.total_count) * 100, 1)
    END AS percentage
  FROM (
    VALUES
      ('funcional'),
      ('atencao_moderada'),
      ('disfuncao'),
      ('disfuncao_severa')
  ) AS p(profile)
  CROSS JOIN total t
  LEFT JOIN counts c ON c.profile = p.profile
  ORDER BY
    CASE p.profile
      WHEN 'funcional' THEN 1
      WHEN 'atencao_moderada' THEN 2
      WHEN 'disfuncao' THEN 3
      WHEN 'disfuncao_severa' THEN 4
    END;
$$;

COMMENT ON FUNCTION public.get_profile_distribution IS
  'Returns distribution of quiz profiles with counts and percentages. Optionally filtered by instructor.';


-- 4. get_instructor_rankings
-- Ranks active instructors by response count.
-- Joins users, quiz_responses, and quiz_leads.
CREATE OR REPLACE FUNCTION public.get_instructor_rankings(
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  instructor_id UUID,
  instructor_name TEXT,
  response_count BIGINT,
  lead_count BIGINT,
  avg_score NUMERIC,
  last_response_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id AS instructor_id,
    u.name AS instructor_name,
    COALESCE(resp.response_count, 0) AS response_count,
    COALESCE(leads.lead_count, 0) AS lead_count,
    COALESCE(resp.avg_score, 0) AS avg_score,
    resp.last_response_at
  FROM users u
  LEFT JOIN (
    SELECT
      qr.instructor_id,
      COUNT(*) AS response_count,
      ROUND(AVG(qr.total_score)::numeric, 1) AS avg_score,
      MAX(qr.created_at) AS last_response_at
    FROM quiz_responses qr
    GROUP BY qr.instructor_id
  ) resp ON resp.instructor_id = u.id
  LEFT JOIN (
    SELECT
      ql.instructor_id,
      COUNT(*) AS lead_count
    FROM quiz_leads ql
    GROUP BY ql.instructor_id
  ) leads ON leads.instructor_id = u.id
  WHERE u.role = 'instructor'
    AND u.is_active = true
  ORDER BY response_count DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_instructor_rankings IS
  'Returns top instructors ranked by response count, with lead count, avg score, and last activity.';


-- 5. get_platform_kpis
-- Returns a single row of platform-wide KPIs.
-- Compares current period vs previous period for growth calculation.
CREATE OR REPLACE FUNCTION public.get_platform_kpis(
  p_period_days INT DEFAULT 30
)
RETURNS TABLE(
  total_instructors BIGINT,
  total_responses BIGINT,
  total_leads BIGINT,
  avg_score NUMERIC,
  responses_current_period BIGINT,
  responses_previous_period BIGINT,
  growth_percentage NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH instructors AS (
    SELECT COUNT(*) AS cnt
    FROM users
    WHERE role = 'instructor' AND is_active = true
  ),
  responses AS (
    SELECT
      COUNT(*) AS total,
      ROUND(AVG(total_score)::numeric, 1) AS avg_sc
    FROM quiz_responses
  ),
  leads AS (
    SELECT COUNT(*) AS cnt FROM quiz_leads
  ),
  current_period AS (
    SELECT COUNT(*) AS cnt
    FROM quiz_responses
    WHERE created_at >= (now() - (p_period_days || ' days')::interval)
  ),
  previous_period AS (
    SELECT COUNT(*) AS cnt
    FROM quiz_responses
    WHERE created_at >= (now() - (p_period_days * 2 || ' days')::interval)
      AND created_at < (now() - (p_period_days || ' days')::interval)
  )
  SELECT
    i.cnt AS total_instructors,
    r.total AS total_responses,
    l.cnt AS total_leads,
    COALESCE(r.avg_sc, 0) AS avg_score,
    cp.cnt AS responses_current_period,
    pp.cnt AS responses_previous_period,
    CASE
      WHEN pp.cnt = 0 THEN
        CASE WHEN cp.cnt > 0 THEN 100.0 ELSE 0.0 END
      ELSE ROUND(((cp.cnt - pp.cnt)::numeric / pp.cnt) * 100, 1)
    END AS growth_percentage
  FROM instructors i
  CROSS JOIN responses r
  CROSS JOIN leads l
  CROSS JOIN current_period cp
  CROSS JOIN previous_period pp;
$$;

COMMENT ON FUNCTION public.get_platform_kpis IS
  'Returns platform-wide KPIs: totals, averages, and period-over-period growth percentage.';


-- 6. get_question_analytics
-- Parses the answers JSONB to extract per-question statistics.
-- Handles both numeric values and arrays (takes array length as value).
-- Filters by instructor if provided.
CREATE OR REPLACE FUNCTION public.get_question_analytics(
  p_instructor_id UUID DEFAULT NULL
)
RETURNS TABLE(question_key TEXT, avg_value NUMERIC, response_count INT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH expanded AS (
    SELECT
      kv.key AS question_key,
      CASE
        -- If the value is a JSON array, use its length
        WHEN jsonb_typeof(kv.value) = 'array' THEN jsonb_array_length(kv.value)::numeric
        -- If it is a number, use it directly
        WHEN jsonb_typeof(kv.value) = 'number' THEN kv.value::numeric
        -- Otherwise skip (NULL will be filtered by the aggregate)
        ELSE NULL
      END AS numeric_value
    FROM quiz_responses qr,
         jsonb_each(qr.answers) AS kv(key, value)
    WHERE (p_instructor_id IS NULL OR qr.instructor_id = p_instructor_id)
  )
  SELECT
    e.question_key,
    ROUND(AVG(e.numeric_value), 2) AS avg_value,
    COUNT(e.numeric_value)::int AS response_count
  FROM expanded e
  WHERE e.numeric_value IS NOT NULL
  GROUP BY e.question_key
  ORDER BY e.question_key;
END;
$$;

COMMENT ON FUNCTION public.get_question_analytics IS
  'Returns per-question average values and response counts by parsing the answers JSONB. Optionally filtered by instructor.';


-- =============================================
-- Indexes to support analytics queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created_date
  ON public.quiz_responses ((created_at::date));

CREATE INDEX IF NOT EXISTS idx_quiz_responses_instructor_created
  ON public.quiz_responses (instructor_id, created_at);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_total_score
  ON public.quiz_responses (total_score);
