import { useMemo } from 'react'
import { useAuthStore } from './authStore'
import { LocalStore } from './localStore'
import { RemoteStore } from './remoteStore'
import { RemoteStoreV2 } from './remoteStoreV2'
import type { Transaction, MonthlySettings, Category, CategoryGroup } from '../types'
import type { CategoryFormData, CategoryGroupFormData } from '../types'

// ---------------------------------------------------------------------------
// Input types for store mutations
// ---------------------------------------------------------------------------

export interface AddTransactionInput {
  amount: number
  type: 'expense' | 'income'
  category: string
  categoryId: string | null
  note: string | null
  date: string
}

export interface UpdateTransactionInput {
  amount: number
  type: 'expense' | 'income'
  category: string
  categoryId: string | null
  note: string | null
  date: string
}

// ---------------------------------------------------------------------------
// DataStore interface — the single contract for all data operations
// ---------------------------------------------------------------------------

export interface DataStore {
  // Transactions
  listTransactions(startDate: string, endDate: string, allowSeed?: boolean, limit?: number): Promise<Transaction[]>
  addTransaction(data: AddTransactionInput): Promise<Transaction>
  updateTransaction(id: string, data: UpdateTransactionInput): Promise<void>
  deleteTransaction(id: string): Promise<void>

  // Monthly Settings
  getMonthlySettings(month: number, year: number): Promise<MonthlySettings | null>
  upsertMonthlyIncome(
    value: number,
    month: number,
    year: number,
    existing: MonthlySettings | null
  ): Promise<MonthlySettings>

  // Categories
  listCategories(): Promise<Category[]>
  createCategory(data: CategoryFormData): Promise<Category>
  updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category>
  deleteCategory(id: string): Promise<void>
  reorderCategories(ordered: { id: string; sort_order: number }[]): Promise<void>

  // Category Groups
  listCategoryGroups(): Promise<CategoryGroup[]>
  createCategoryGroup(data: CategoryGroupFormData): Promise<CategoryGroup>
  updateCategoryGroup(id: string, data: Partial<CategoryGroupFormData>): Promise<CategoryGroup>
  deleteCategoryGroup(id: string): Promise<void>
}

// ---------------------------------------------------------------------------
// Feature flag: set VITE_USE_API_LAYER=true in .env.local to use the API layer
// ---------------------------------------------------------------------------

export function useApiLayer(): boolean {
  return import.meta.env.VITE_USE_API_LAYER === 'true'
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDataStore(
  isGuest: boolean,
  userId: string | undefined,
  useApi: boolean = useApiLayer()
): DataStore | null {
  if (isGuest) {
    return new LocalStore()
  }
  if (!userId) {
    return null
  }
  return useApi ? new RemoteStoreV2(userId) : new RemoteStore(userId)
}

// ---------------------------------------------------------------------------
// Hook — provides the correct store based on auth state
// ---------------------------------------------------------------------------

export function useDataStore(): DataStore | null {
  const { user, isGuest } = useAuthStore()
  return useMemo(() => createDataStore(isGuest, user?.id), [isGuest, user?.id])
}