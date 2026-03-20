-- =============================================
-- Migration 010: Fix RLS policies — 'master' → 'admin'
-- =============================================
-- The role was renamed from 'master' to 'admin' in migration 009,
-- but the RLS policies still referenced 'master', blocking all admin access.

-- 1. Fix users table policies
DROP POLICY IF EXISTS "master_all_users" ON public.users;
CREATE POLICY "admin_all_users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Keep instructor_self as-is (already correct)

-- 2. Fix quiz_leads policies
DROP POLICY IF EXISTS "master_all_leads" ON public.quiz_leads;
CREATE POLICY "admin_all_leads" ON public.quiz_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- 3. Fix quiz_responses policies
DROP POLICY IF EXISTS "master_all_responses" ON public.quiz_responses;
CREATE POLICY "admin_all_responses" ON public.quiz_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- 4. Fix audit_logs policies
DROP POLICY IF EXISTS "master_all_logs" ON public.audit_logs;
CREATE POLICY "admin_all_logs" ON public.audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- 5. Fix invite_tokens policy
DROP POLICY IF EXISTS "Master can manage invite tokens" ON public.invite_tokens;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invite_tokens' AND table_schema = 'public') THEN
    CREATE POLICY "admin_manage_invite_tokens"
      ON public.invite_tokens
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
      );
  END IF;
END $$;

-- 6. Add trigger to auto-create user profile on auth signup
-- This ensures that when a user signs up via Supabase Auth,
-- a corresponding row is created in public.users automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'instructor',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
