export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'expense' | 'income'
  category: string
  category_id: string | null
  note: string | null
  date: string
  created_at: string
  is_recurring?: boolean
  recurring_template_id?: string | null
}

export interface MonthlySettings {
  id: string
  user_id: string
  income: number
  month: number
  year: number
  created_at: string
  updated_at: string
}

export interface CategoryGroup {
  id: string
  user_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'expense' | 'income'
  group_id: string | null
  group_name?: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
}

export interface CategoryWithGroup extends Category {
  group?: CategoryGroup
}

export type CategoryPickerItem = {
  group: CategoryGroup | null
  categories: Category[]
}

export type CategoryFormData = {
  name: string
  type: 'expense' | 'income'
  group_id: string | null
  icon: string | null
  color: string | null
}

export type CategoryGroupFormData = {
  name: string
}

export type LegacyCategory = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Shopping' | 'Health' | 'Other'

export const LEGACY_CATEGORIES: LegacyCategory[] = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Other'
]

export const DEFAULT_ICONS = ['🍔', '🚗', '💡', '🎬', '🛒', '💊', '📦', '🏠', '✈️', '🎮', '📚', '👗', '🎁', '💰', '📱', '🏋️']

export const DEFAULT_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899',
  '#EF4444', '#6B7280', '#14B8A6', '#F97316', '#6366F1'
]