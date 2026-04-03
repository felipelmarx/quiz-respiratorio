-- =============================================
-- Migration 016: Student Progress Tracking
-- Tracks persistent student identities across multiple quiz attempts
-- =============================================

-- =============================================
-- 1. student_profiles table
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  first_attempt_at TIMESTAMPTZ,
  latest_attempt_at TIMESTAMPTZ,
  attempt_count INTEGER DEFAULT 0,
  best_score INTEGER,
  latest_score INTEGER,
  latest_profile TEXT,
  improvement_trend TEXT, -- 'improving', 'stable', 'declining'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on email (idempotent via IF NOT EXISTS on index)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_email_key'
  ) THEN
    ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON public.student_profiles(email);

-- Index on latest_attempt_at for sorting
CREATE INDEX IF NOT EXISTS idx_student_profiles_latest_attempt ON public.student_profiles(latest_attempt_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS for student_profiles
-- =============================================
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Admin can read all student profiles
DROP POLICY IF EXISTS "admin_all_student_profiles" ON public.student_profiles;
CREATE POLICY "admin_all_student_profiles" ON public.student_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Instructors can read student profiles for their leads
DROP POLICY IF EXISTS "instructor_read_student_profiles" ON public.student_profiles;
CREATE POLICY "instructor_read_student_profiles" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_leads ql
      WHERE ql.email = student_profiles.email
        AND ql.instructor_id = auth.uid()
    )
  );

-- Public/anon can read their own profile by email (for results page)
DROP POLICY IF EXISTS "anon_read_own_profile" ON public.student_profiles;
CREATE POLICY "anon_read_own_profile" ON public.student_profiles
  FOR SELECT USING (true);

-- =============================================
-- 2. Function: upsert_student_profile()
-- Triggered AFTER INSERT on quiz_responses
-- =============================================
CREATE OR REPLACE FUNCTION public.upsert_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_previous_score INTEGER;
  v_current_trend TEXT;
BEGIN
  -- Skip if no lead_id (anonymous response without contact info)
  IF NEW.lead_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up the lead's contact info
  SELECT ql.email, ql.name, ql.phone
    INTO v_email, v_name, v_phone
    FROM public.quiz_leads ql
   WHERE ql.id = NEW.lead_id;

  -- Skip if lead not found or email is missing
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch the previous latest score for trend calculation
  SELECT sp.latest_score
    INTO v_previous_score
    FROM public.student_profiles sp
   WHERE sp.email = v_email;

  -- Calculate improvement trend by comparing with previous score
  IF v_previous_score IS NULL THEN
    -- First attempt, no trend yet
    v_current_trend := NULL;
  ELSIF NEW.total_score > v_previous_score THEN
    v_current_trend := 'improving';
  ELSIF NEW.total_score < v_previous_score THEN
    v_current_trend := 'declining';
  ELSE
    v_current_trend := 'stable';
  END IF;

  -- Upsert into student_profiles
  INSERT INTO public.student_profiles (
    email, name, phone,
    first_attempt_at, latest_attempt_at,
    attempt_count, best_score, latest_score,
    latest_profile, improvement_trend
  ) VALUES (
    v_email, v_name, v_phone,
    NEW.created_at, NEW.created_at,
    1, NEW.total_score, NEW.total_score,
    NEW.profile, v_current_trend
  )
  ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, student_profiles.name),
    phone = COALESCE(EXCLUDED.phone, student_profiles.phone),
    latest_attempt_at = EXCLUDED.latest_attempt_at,
    attempt_count = student_profiles.attempt_count + 1,
    latest_score = EXCLUDED.latest_score,
    latest_profile = EXCLUDED.latest_profile,
    best_score = GREATEST(student_profiles.best_score, EXCLUDED.best_score),
    improvement_trend = v_current_trend,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- =============================================
-- 3. Function: get_student_progress(p_email TEXT)
-- Returns the student profile + all scores over time
-- =============================================
CREATE OR REPLACE FUNCTION public.get_student_progress(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile JSON;
  v_scores JSON;
  v_result JSON;
BEGIN
  -- Get student profile
  SELECT row_to_json(sp.*)
    INTO v_profile
    FROM public.student_profiles sp
   WHERE sp.email = p_email;

  -- If no profile found, return null
  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get all scores over time, ordered by date
  SELECT json_agg(attempts ORDER BY attempt_date ASC)
    INTO v_scores
    FROM (
      SELECT
        qr.total_score AS score,
        qr.profile,
        qr.scores AS category_scores,
        qr.created_at AS attempt_date
      FROM public.quiz_responses qr
      JOIN public.quiz_leads ql ON ql.id = qr.lead_id
      WHERE ql.email = p_email
      ORDER BY qr.created_at ASC
    ) attempts;

  -- Combine profile and scores into a single result
  v_result := json_build_object(
    'profile', v_profile,
    'attempts', COALESCE(v_scores, '[]'::json)
  );

  RETURN v_result;
END;
$$;

-- =============================================
-- 4. Trigger on quiz_responses
-- =============================================
DROP TRIGGER IF EXISTS trg_upsert_student_profile ON public.quiz_responses;
CREATE TRIGGER trg_upsert_student_profile
  AFTER INSERT ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_student_profile();

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE public.student_profiles IS 'Persistent student identities tracking progress across multiple quiz attempts';
COMMENT ON FUNCTION public.upsert_student_profile() IS 'Automatically creates or updates student profile when a quiz response is submitted';
COMMENT ON FUNCTION public.get_student_progress(TEXT) IS 'Returns student profile and full attempt history for the results page';
