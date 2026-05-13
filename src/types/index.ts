export interface Transaction {
  id: string
  user_id: string
  amount: number
  category: string
  note: string | null
  date: string
  created_at: string
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

export type Category = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Shopping' | 'Health' | 'Other'

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Other'
]