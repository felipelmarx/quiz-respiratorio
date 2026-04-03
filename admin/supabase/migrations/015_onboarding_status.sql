-- Add onboarding_completed_at column to users table
-- NULL means onboarding not completed yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END
$$;
