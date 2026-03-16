-- Migration: Add instructor profile fields for quiz result personalization
-- These fields are used in the quiz result page to personalize the
-- session invitation and footer with the instructor's professional info.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profissao TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS nome_clinica TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.profissao IS 'Professional title, e.g. psicólogo(a), médico(a), terapeuta respiratório';
COMMENT ON COLUMN public.users.cidade IS 'City and state, e.g. São Paulo, SP';
COMMENT ON COLUMN public.users.nome_clinica IS 'Optional clinic or office name';
