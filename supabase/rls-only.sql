-- RLS Setup for SimpleBudget (run in Supabase SQL Editor)
-- Note: Tables already exist, so we only enable RLS and create policies

-- ============================================================================
-- ROW-LEVEL SECURITY (AUTH-05)
-- ============================================================================

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on monthly_settings table
ALTER TABLE public.monthly_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR TRANSACTIONS
-- ============================================================================

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own transactions
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own transactions
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own transactions
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES FOR MONTHLY_SETTINGS
-- ============================================================================

-- Users can only see their own monthly settings
CREATE POLICY "Users can view own monthly settings" ON public.monthly_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own monthly settings
CREATE POLICY "Users can insert own monthly settings" ON public.monthly_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own monthly settings
CREATE POLICY "Users can update own monthly settings" ON public.monthly_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own monthly settings
CREATE POLICY "Users can delete own monthly settings" ON public.monthly_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES (Performance optimization)
-- ============================================================================

-- Index for faster queries by user_id and date range
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON public.transactions(user_id, date DESC);

-- Index for faster queries by user_id, month, year
CREATE INDEX IF NOT EXISTS idx_monthly_settings_user_month_year 
  ON public.monthly_settings(user_id, month, year);