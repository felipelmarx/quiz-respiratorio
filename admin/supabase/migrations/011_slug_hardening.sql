-- =============================================
-- Migration 011: Slug Hardening
-- =============================================
-- Ensures all instructors have valid, unique slugs.
-- Adds validation, constraints, and auto-generation.
-- =============================================

-- =============================================
-- 1. Helper function: generate a slug from a name
-- =============================================
-- Converts a name to a URL-friendly slug:
--   - Transliterates accented characters to ASCII
--   - Lowercases everything
--   - Replaces non-alphanumeric characters with hyphens
--   - Collapses multiple hyphens
--   - Trims leading/trailing hyphens
CREATE OR REPLACE FUNCTION public.generate_slug_from_name(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
BEGIN
  v_slug := p_name;

  -- Transliterate common Portuguese/accented characters
  v_slug := translate(v_slug,
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
  );

  -- Lowercase
  v_slug := lower(v_slug);

  -- Replace non-alphanumeric characters with hyphens
  v_slug := regexp_replace(v_slug, '[^a-z0-9]', '-', 'g');

  -- Collapse multiple consecutive hyphens into one
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');

  -- Trim leading and trailing hyphens
  v_slug := trim(BOTH '-' FROM v_slug);

  -- Ensure minimum length (pad with random suffix if too short)
  IF length(v_slug) < 3 THEN
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
    v_slug := trim(BOTH '-' FROM v_slug);
  END IF;

  -- Truncate to max 50 characters (trim trailing hyphen after truncation)
  IF length(v_slug) > 50 THEN
    v_slug := left(v_slug, 50);
    v_slug := trim(TRAILING '-' FROM v_slug);
  END IF;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- =============================================
-- 2. Backfill NULL slugs for existing instructors
-- =============================================
-- For each instructor with a NULL slug, generate one from their name.
-- Handles duplicates by appending a numeric suffix (-2, -3, etc.)
DO $$
DECLARE
  r RECORD;
  v_base_slug TEXT;
  v_candidate TEXT;
  v_suffix INTEGER;
BEGIN
  FOR r IN
    SELECT id, name
    FROM public.users
    WHERE role = 'instructor' AND slug IS NULL
    ORDER BY created_at ASC
  LOOP
    v_base_slug := public.generate_slug_from_name(r.name);
    v_candidate := v_base_slug;
    v_suffix := 1;

    -- Check for uniqueness, append suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE slug = v_candidate AND id != r.id) LOOP
      v_suffix := v_suffix + 1;
      v_candidate := v_base_slug || '-' || v_suffix::text;

      -- Ensure we don't exceed 50 chars with suffix
      IF length(v_candidate) > 50 THEN
        v_candidate := left(v_base_slug, 50 - length('-' || v_suffix::text)) || '-' || v_suffix::text;
      END IF;
    END LOOP;

    UPDATE public.users SET slug = v_candidate WHERE id = r.id;
    RAISE NOTICE 'Generated slug "%" for instructor % (%)', v_candidate, r.name, r.id;
  END LOOP;
END;
$$;


-- =============================================
-- 3. Validation function for slugs
-- =============================================
-- Rules:
--   - Must be lowercase
--   - Only letters (a-z), numbers (0-9), and hyphens allowed
--   - Must be between 3 and 50 characters
--   - Cannot start or end with a hyphen
CREATE OR REPLACE FUNCTION public.validate_slug(p_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- NULL slugs are allowed (for non-instructor users)
  IF p_slug IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Must be lowercase (no uppercase letters)
  IF p_slug <> lower(p_slug) THEN
    RETURN FALSE;
  END IF;

  -- Only lowercase letters, numbers, and hyphens
  IF p_slug !~ '^[a-z0-9-]+$' THEN
    RETURN FALSE;
  END IF;

  -- Length between 3 and 50
  IF length(p_slug) < 3 OR length(p_slug) > 50 THEN
    RETURN FALSE;
  END IF;

  -- Cannot start or end with a hyphen
  IF p_slug LIKE '-%' OR p_slug LIKE '%-' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- =============================================
-- 4. CHECK constraint on the slug column
-- =============================================
-- Uses the validation function to enforce slug format.
-- Drops first if it already exists (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_users_slug_format'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT chk_users_slug_format
      CHECK (public.validate_slug(slug));
  END IF;
END;
$$;


-- =============================================
-- 5. UNIQUE constraint on slug
-- =============================================
-- The column was defined as TEXT UNIQUE in 001_initial_schema.sql,
-- so a unique constraint already exists. We verify and add only if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_slug_key'
      AND conrelid = 'public.users'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_slug_key UNIQUE (slug);
  END IF;
END;
$$;


-- =============================================
-- 6. Trigger: auto-generate slug on INSERT
-- =============================================
-- When a new user is inserted without a slug, automatically
-- generate one from their name. Handles duplicates with suffixes.
CREATE OR REPLACE FUNCTION public.trigger_auto_generate_slug()
RETURNS TRIGGER AS $$
DECLARE
  v_base_slug TEXT;
  v_candidate TEXT;
  v_suffix INTEGER;
BEGIN
  -- Only auto-generate if slug is not provided and user has a name
  IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
    v_base_slug := public.generate_slug_from_name(NEW.name);
    v_candidate := v_base_slug;
    v_suffix := 1;

    -- Check for uniqueness, append suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE slug = v_candidate) LOOP
      v_suffix := v_suffix + 1;
      v_candidate := v_base_slug || '-' || v_suffix::text;

      -- Ensure we don't exceed 50 chars with suffix
      IF length(v_candidate) > 50 THEN
        v_candidate := left(v_base_slug, 50 - length('-' || v_suffix::text)) || '-' || v_suffix::text;
      END IF;
    END LOOP;

    NEW.slug := v_candidate;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate to ensure idempotency
DROP TRIGGER IF EXISTS trg_auto_generate_slug ON public.users;
CREATE TRIGGER trg_auto_generate_slug
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_generate_slug();
