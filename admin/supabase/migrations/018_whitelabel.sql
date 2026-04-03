-- Migration: 018_whitelabel
-- Add white-label branding options for instructors
-- Allows instructors to customize quiz appearance for their personalized links

-- Add branding JSONB column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'branding'
  ) THEN
    ALTER TABLE users ADD COLUMN branding JSONB DEFAULT '{}';
  END IF;
END $$;

-- Document the expected JSONB structure
COMMENT ON COLUMN users.branding IS 'White-label branding settings for instructor quiz pages. Structure:
{
  "primary_color": "#0A192F",       -- Primary brand color (hex)
  "accent_color": "#C6A868",        -- Accent/highlight color (hex)
  "logo_url": null,                 -- URL to custom logo image (https)
  "welcome_message": "Avalie sua saúde respiratória",  -- Quiz welcome text
  "cta_text": "Agendar Consulta",   -- CTA button label on results page
  "cta_url": null                   -- CTA button link (e.g. WhatsApp, booking)
}';
