-- 1. Add type to transactions
ALTER TABLE public.transactions 
ADD COLUMN type TEXT NOT NULL DEFAULT 'expense' 
CHECK (type IN ('expense', 'income'));

-- 2. Add type to categories
ALTER TABLE public.categories 
ADD COLUMN type TEXT NOT NULL DEFAULT 'expense' 
CHECK (type IN ('expense', 'income'));

-- 3. Seed default income categories for existing users
DO $$
DECLARE
  user_record RECORD;
  income_group_id UUID;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Create 'Income' group if not exists
    INSERT INTO public.category_groups (user_id, name, sort_order)
    SELECT user_record.id, 'Income', 1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.category_groups WHERE user_id = user_record.id AND name = 'Income'
    )
    RETURNING id INTO income_group_id;

    IF income_group_id IS NULL THEN
      SELECT id INTO income_group_id
      FROM public.category_groups
      WHERE user_id = user_record.id AND name = 'Income';
    END IF;

    -- Insert default income categories if they don't exist
    INSERT INTO public.categories (user_id, name, group_id, icon, color, sort_order, type)
    SELECT user_record.id, cat.name, income_group_id, cat.icon, cat.color, cat.sort_order, cat.type
    FROM (VALUES
      ('Salary', '💼', '#10B981', 0, 'income'),
      ('Gift', '🎁', '#3B82F6', 1, 'income')
    ) AS cat(name, icon, color, sort_order, type)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories c2
      WHERE c2.user_id = user_record.id AND LOWER(c2.name) = LOWER(cat.name)
    );
  END LOOP;
END $$;
