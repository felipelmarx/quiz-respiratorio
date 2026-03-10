-- =============================================
-- iBreathwork Quiz - Database Schema
-- =============================================

-- 1. Users table (instructors and master admins)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'instructor' CHECK (role IN ('master', 'instructor')),
  whatsapp TEXT,
  avatar_url TEXT,
  slug TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Quiz leads table (contact info)
CREATE TABLE IF NOT EXISTS public.quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  referral TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Quiz responses table (answers and scores)
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.quiz_leads(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  profile TEXT NOT NULL CHECK (profile IN ('funcional', 'atencao_moderada', 'disfuncao', 'disfuncao_severa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_quiz_leads_instructor ON public.quiz_leads(instructor_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_email ON public.quiz_leads(email);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created ON public.quiz_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_lead ON public.quiz_responses(lead_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_instructor ON public.quiz_responses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_profile ON public.quiz_responses(profile);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created ON public.quiz_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_slug ON public.users(slug);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: master sees all, instructors see only themselves
DROP POLICY IF EXISTS "master_all_users" ON public.users;
CREATE POLICY "master_all_users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'master')
  );

DROP POLICY IF EXISTS "instructor_self" ON public.users;
CREATE POLICY "instructor_self" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Quiz Leads: master sees all, instructor sees own leads
DROP POLICY IF EXISTS "master_all_leads" ON public.quiz_leads;
CREATE POLICY "master_all_leads" ON public.quiz_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'master')
  );

DROP POLICY IF EXISTS "instructor_own_leads" ON public.quiz_leads;
CREATE POLICY "instructor_own_leads" ON public.quiz_leads
  FOR SELECT USING (instructor_id = auth.uid());

-- Allow anonymous inserts for quiz submissions (public quiz)
DROP POLICY IF EXISTS "anon_insert_leads" ON public.quiz_leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON public.quiz_leads;
CREATE POLICY "anon_insert_leads" ON public.quiz_leads
  FOR INSERT WITH CHECK (true);

-- Quiz Responses: master sees all, instructor sees own
DROP POLICY IF EXISTS "master_all_responses" ON public.quiz_responses;
CREATE POLICY "master_all_responses" ON public.quiz_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'master')
  );

DROP POLICY IF EXISTS "instructor_own_responses" ON public.quiz_responses;
CREATE POLICY "instructor_own_responses" ON public.quiz_responses
  FOR SELECT USING (instructor_id = auth.uid());

-- Allow anonymous inserts for quiz submissions
DROP POLICY IF EXISTS "anon_insert_responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Allow public insert responses" ON public.quiz_responses;
CREATE POLICY "anon_insert_responses" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

-- Audit Logs: master only
DROP POLICY IF EXISTS "master_all_logs" ON public.audit_logs;
CREATE POLICY "master_all_logs" ON public.audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'master')
  );

DROP POLICY IF EXISTS "user_insert_logs" ON public.audit_logs;
CREATE POLICY "user_insert_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- Updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Helper function: resolve instructor slug to ID
-- =============================================
CREATE OR REPLACE FUNCTION public.resolve_instructor_slug(p_slug TEXT)
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE slug = p_slug AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
