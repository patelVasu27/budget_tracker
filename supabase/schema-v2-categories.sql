-- SimpleBudget v2.0: Custom Categories Schema
-- Run this script in Supabase SQL Editor to add custom category support
-- This migration adds: category_groups, categories tables, and updates transactions

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Category Groups: User-defined groupings for categories
CREATE TABLE IF NOT EXISTS public.category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 32),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Categories: User-defined expense categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 32),
  group_id UUID REFERENCES public.category_groups(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, LOWER(name))
);

-- ============================================================================
-- UPDATE EXISTING TRANSACTIONS TABLE
-- ============================================================================

-- Add category_id column to transactions (nullable, for migration)
ALTER TABLE public.transactions ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Make the existing category column nullable (was NOT NULL)
ALTER TABLE public.transactions ALTER COLUMN category DROP NOT NULL;

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on category_groups
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category_groups
CREATE POLICY "Users can view own category_groups" ON public.category_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category_groups" ON public.category_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category_groups" ON public.category_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own category_groups" ON public.category_groups
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_category_groups_user_order ON public.category_groups(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_user_group_order ON public.categories(user_id, group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);

-- ============================================================================
-- SEED DEFAULT CATEGORIES (runs once per new user via trigger)
-- ============================================================================

-- Create a function to seed default categories for new users
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  default_group_id UUID;
BEGIN
  -- Create default group
  INSERT INTO public.category_groups (user_id, name, sort_order)
  VALUES (NEW.id, 'Default', 0)
  RETURNING id INTO default_group_id;

  -- Create income group
  DECLARE
    income_group_id UUID;
  BEGIN
    INSERT INTO public.category_groups (user_id, name, sort_order)
    VALUES (NEW.id, 'Income', 1)
    RETURNING id INTO income_group_id;

    -- Seed default expense categories matching v1
    INSERT INTO public.categories (user_id, name, group_id, icon, color, sort_order, type) VALUES
      (NEW.id, 'Food', default_group_id, '🍔', '#10B981', 0, 'expense'),
      (NEW.id, 'Transport', default_group_id, '🚗', '#3B82F6', 1, 'expense'),
      (NEW.id, 'Utilities', default_group_id, '💡', '#F59E0B', 2, 'expense'),
      (NEW.id, 'Entertainment', default_group_id, '🎬', '#8B5CF6', 3, 'expense'),
      (NEW.id, 'Shopping', default_group_id, '🛒', '#EC4899', 4, 'expense'),
      (NEW.id, 'Health', default_group_id, '💊', '#EF4444', 5, 'expense'),
      (NEW.id, 'Other', default_group_id, '📦', '#6B7280', 6, 'expense');

    -- Seed default income categories
    INSERT INTO public.categories (user_id, name, group_id, icon, color, sort_order, type) VALUES
      (NEW.id, 'Salary', income_group_id, '💼', '#10B981', 0, 'income'),
      (NEW.id, 'Gift', income_group_id, '🎁', '#3B82F6', 1, 'income');
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to seed defaults for new users (after auth.users insert)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_categories();

-- ============================================================================
-- MIGRATION: Seed default categories for EXISTING users
-- ============================================================================

-- Ensures existing users (who missed the trigger) get default categories
DO $$
DECLARE
  user_record RECORD;
  default_group_id UUID;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Create Default group if missing
    INSERT INTO public.category_groups (user_id, name, sort_order)
    SELECT user_record.id, 'Default', 0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.category_groups WHERE user_id = user_record.id AND name = 'Default'
    )
    RETURNING id INTO default_group_id;

    -- If group already exists, get its id
    IF default_group_id IS NULL THEN
      SELECT id INTO default_group_id
      FROM public.category_groups
      WHERE user_id = user_record.id AND name = 'Default';
    END IF;

    -- Seed default categories (skip if already exist for this user)
    INSERT INTO public.categories (user_id, name, group_id, icon, color, sort_order, type)
    SELECT user_record.id, cat.name, default_group_id, cat.icon, cat.color, cat.sort_order, cat.type
    FROM (VALUES
      ('Food', '🍔', '#10B981', 0, 'expense'),
      ('Transport', '🚗', '#3B82F6', 1, 'expense'),
      ('Utilities', '💡', '#F59E0B', 2, 'expense'),
      ('Entertainment', '🎬', '#8B5CF6', 3, 'expense'),
      ('Shopping', '🛒', '#EC4899', 4, 'expense'),
      ('Health', '💊', '#EF4444', 5, 'expense'),
      ('Other', '📦', '#6B7280', 6, 'expense')
    ) AS cat(name, icon, color, sort_order, type)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories c2
      WHERE c2.user_id = user_record.id AND LOWER(c2.name) = LOWER(cat.name)
    );

    -- Create Income group if missing
    INSERT INTO public.category_groups (user_id, name, sort_order)
    SELECT user_record.id, 'Income', 1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.category_groups WHERE user_id = user_record.id AND name = 'Income'
    );

    -- Seed default income categories
    INSERT INTO public.categories (user_id, name, group_id, icon, color, sort_order, type)
    SELECT user_record.id, cat.name, cg.id, cat.icon, cat.color, cat.sort_order, cat.type
    FROM public.category_groups cg
    CROSS JOIN (VALUES
      ('Salary', '💼', '#10B981', 0, 'income'),
      ('Gift', '🎁', '#3B82F6', 1, 'income')
    ) AS cat(name, icon, color, sort_order, type)
    WHERE cg.user_id = user_record.id AND cg.name = 'Income'
      AND NOT EXISTS (
        SELECT 1 FROM public.categories c2
        WHERE c2.user_id = user_record.id AND LOWER(c2.name) = LOWER(cat.name)
      );
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION: Map existing transactions to new categories
-- ============================================================================

-- Maps old text-based category names to the new UUID-based category IDs
DO $$
DECLARE
  rec RECORD;
  cat_id UUID;
BEGIN
  FOR rec IN
    SELECT DISTINCT user_id, LOWER(TRIM(category)) as cat_name
    FROM public.transactions
    WHERE category IS NOT NULL AND category_id IS NULL
  LOOP
    -- Find matching category (case-insensitive, same user)
    SELECT id INTO cat_id
    FROM public.categories
    WHERE user_id = rec.user_id AND LOWER(name) = rec.cat_name
    LIMIT 1;

    IF cat_id IS NOT NULL THEN
      UPDATE public.transactions
      SET category_id = cat_id
      WHERE user_id = rec.user_id
        AND LOWER(TRIM(category)) = rec.cat_name
        AND category_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- Add a unique constraint on user_id for the categories table after migration
-- (idempotent: skip if the constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_category_name'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT unique_user_category_name UNIQUE (user_id, LOWER(name));
  END IF;
END $$;