-- Invite tokens for instructor self-registration
-- Only ONE token is active at any time. Generating a new token deactivates the previous.

CREATE TABLE public.invite_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

-- Fast lookup for active token validation during signup
CREATE INDEX idx_invite_tokens_active ON public.invite_tokens (token) WHERE is_active = true;

-- RLS: only master can read/write tokens via authenticated queries
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage invite tokens"
  ON public.invite_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );
