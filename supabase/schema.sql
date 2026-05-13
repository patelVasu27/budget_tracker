-- SimpleBudget Database Schema with Row-Level Security (RLS)
-- Run this script in Supabase SQL Editor to set up tables and security policies

-- ============================================================================
-- TABLES
-- ============================================================================

-- Transactions table: stores individual expense/income entries
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly settings table: stores user's monthly income/balance
CREATE TABLE IF NOT EXISTS public.monthly_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (income >= 0),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

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

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Note: Real data will be added by users through the app
-- This is just a comment placeholder for any seed data needs