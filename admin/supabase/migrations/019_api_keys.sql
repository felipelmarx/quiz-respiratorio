-- =============================================
-- API Keys for External API v1 Access
-- =============================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{read}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on key_hash for fast lookups during API auth
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- Index on user_id for listing user's keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Admin sees all API keys
DROP POLICY IF EXISTS "admin_all_api_keys" ON public.api_keys;
CREATE POLICY "admin_all_api_keys" ON public.api_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Users can see and manage their own keys
DROP POLICY IF EXISTS "user_own_api_keys_select" ON public.api_keys;
CREATE POLICY "user_own_api_keys_select" ON public.api_keys
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_api_keys_insert" ON public.api_keys;
CREATE POLICY "user_own_api_keys_insert" ON public.api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_api_keys_delete" ON public.api_keys;
CREATE POLICY "user_own_api_keys_delete" ON public.api_keys
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_own_api_keys_update" ON public.api_keys;
CREATE POLICY "user_own_api_keys_update" ON public.api_keys
  FOR UPDATE USING (user_id = auth.uid());
