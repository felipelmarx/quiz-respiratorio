-- =============================================
-- Migration: Make lead_id nullable in quiz_responses
-- Allows saving anonymous quiz responses before lead capture
-- =============================================

-- Make lead_id nullable (allows anonymous responses)
ALTER TABLE public.quiz_responses ALTER COLUMN lead_id DROP NOT NULL;

-- Allow anonymous updates for linking leads to responses
DROP POLICY IF EXISTS "anon_update_responses" ON public.quiz_responses;
CREATE POLICY "anon_update_responses" ON public.quiz_responses
  FOR UPDATE USING (lead_id IS NULL) WITH CHECK (true);
