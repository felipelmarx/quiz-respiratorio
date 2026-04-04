-- Migration: Add notification_preferences column to users table
-- This column stores per-user email notification settings as JSONB.
--
-- Structure:
-- {
--   "email_on_new_response": boolean,    -- Send email on each new quiz response
--   "email_digest_frequency": string,    -- "none" | "daily" | "weekly"
--   "email_digest_day": number           -- 0=Sunday, 1=Monday, ..., 6=Saturday (used when frequency is "weekly")
-- }

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}';
    COMMENT ON COLUMN users.notification_preferences IS 'Email notification preferences: {email_on_new_response: bool, email_digest_frequency: "none"|"daily"|"weekly", email_digest_day: 0-6}';
  END IF;
END $$;
