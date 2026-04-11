-- Migration 020: Add extra_data column to quiz_leads
-- ----------------------------------------------------
-- The Stories experience (PR #20) introduced a richer qualification flow
-- that captures wellbeing_before, wellbeing_after, pain selections,
-- commitment level, and schedule preferences. These were already being
-- assembled client-side in app.js `submitQualificationFinal()` but had
-- no destination column.
--
-- This migration adds a JSONB column so qualitative lead metadata can be
-- persisted without schema churn every time we add a new field.
--
-- Safe / idempotent:
--   - IF NOT EXISTS guards re-runs
--   - Default '{}'::jsonb so existing rows remain valid
--   - RLS policies unchanged (inherits quiz_leads policies)

ALTER TABLE public.quiz_leads
    ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.quiz_leads.extra_data IS
    'Qualitative lead metadata from qualification form. Expected keys: '
    'wellbeing_before, wellbeing_after, wellbeing_delta, pains (array), '
    'commitment, schedule (array), problems (array), source.';

-- GIN index for querying inside the JSONB (used by the admin dashboard
-- when filtering leads by wellbeing delta or pain selections).
CREATE INDEX IF NOT EXISTS idx_quiz_leads_extra_data
    ON public.quiz_leads USING GIN (extra_data);
