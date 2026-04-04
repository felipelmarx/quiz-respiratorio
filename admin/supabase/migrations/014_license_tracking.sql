-- =============================================
-- Migration 014: License tracking and history
-- =============================================

-- 1. Add license plan and price columns to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS license_plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS license_price NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN public.users.license_plan IS 'Plano de licença: free, monthly, annual, lifetime.';
COMMENT ON COLUMN public.users.license_price IS 'Preço da licença atual.';

-- 2. Create license_history table
CREATE TABLE IF NOT EXISTS public.license_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  previous_plan TEXT,
  new_plan TEXT,
  previous_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  changed_by UUID REFERENCES public.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.license_history IS 'Histórico de alterações de licença dos instrutores.';

-- Index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_license_history_user_id
  ON public.license_history(user_id);

-- 3. RLS: only admin can read/write license_history
ALTER TABLE public.license_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_license_history" ON public.license_history;
CREATE POLICY "admin_all_license_history" ON public.license_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- 4. Trigger function to auto-log license changes
CREATE OR REPLACE FUNCTION public.log_license_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if license_plan or license_price actually changed
  IF (OLD.license_plan IS DISTINCT FROM NEW.license_plan)
     OR (OLD.license_price IS DISTINCT FROM NEW.license_price) THEN
    INSERT INTO public.license_history (
      user_id,
      previous_plan,
      new_plan,
      previous_price,
      new_price,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.license_plan,
      NEW.license_plan,
      OLD.license_price,
      NEW.license_price,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_license_change() IS 'Registra automaticamente alterações de licença no histórico.';

-- Create the trigger on users table
DROP TRIGGER IF EXISTS trigger_log_license_change ON public.users;
CREATE TRIGGER trigger_log_license_change
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_license_change();

-- 5. Function to get license summary (plan distribution and revenue)
CREATE OR REPLACE FUNCTION public.get_license_summary()
RETURNS TABLE (
  plan TEXT,
  count BIGINT,
  total_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.license_plan AS plan,
    COUNT(*) AS count,
    SUM(u.license_price) AS total_revenue
  FROM public.users u
  WHERE u.role = 'instructor'
  GROUP BY u.license_plan
  ORDER BY count DESC;
END;
$$;

COMMENT ON FUNCTION public.get_license_summary() IS 'Retorna resumo de licenças: plano, quantidade e receita total.';
