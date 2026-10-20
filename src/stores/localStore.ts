import type { Transaction, MonthlySettings, Category, CategoryGroup } from '../types'
import type { CategoryFormData, CategoryGroupFormData } from '../types'
import type { DataStore, AddTransactionInput, UpdateTransactionInput } from './dataStore'

const GUEST_TRANSACTIONS_KEY = 'guest_transactions'
const GUEST_INITIALIZED_KEY = 'guest_initialized'

function guestSettingsKey(year: number, month: number): string {
  return `guest_settings_${year}_${month}`
}

function guestCategoriesKey(): string {
  return 'guest_categories'
}

function guestCategoryGroupsKey(): string {
  return 'guest_category_groups'
}

function parseJSON<T>(raw: string | null): T | null {
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export class LocalStore implements DataStore {
  // -----------------------------------------------------------------------
  // Transactions
  // -----------------------------------------------------------------------

  async listTransactions(startDate: string, endDate: string, allowSeed: boolean = false, limit?: number): Promise<Transaction[]> {
    const raw = localStorage.getItem(GUEST_TRANSACTIONS_KEY)
    const initialized = localStorage.getItem(GUEST_INITIALIZED_KEY)
    let allTransactions: Transaction[] = []
    let parseFailed = false

    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as Transaction[]
        if (Array.isArray(parsed)) {
          allTransactions = parsed
        } else {
          allTransactions = []
        }
      } catch {
        parseFailed = true
      }
    }

    // Seed default data on first run (only when viewing current month context)
    if (allowSeed && (initialized !== 'true' || raw === null || parseFailed)) {
      const today = new Date().toISOString().split('T')[0]
      const defaultTransactions: Transaction[] = [
        {
          id: 'tx-salary',
          user_id: 'guest',
          amount: 25000,
          type: 'income',
          category: 'Salary',
          category_id: 'cat-salary',
          note: 'Seeded monthly income',
          date: today,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tx-food',
          user_id: 'guest',
          amount: 250,
          type: 'expense',
          category: 'Food',
          category_id: 'cat-food',
          note: 'Dinner at restaurant',
          date: today,
          created_at: new Date(Date.now() - 1000).toISOString(),
        },
        {
          id: 'tx-transport',
          user_id: 'guest',
          amount: 150,
          type: 'expense',
          category: 'Transport',
          category_id: 'cat-transport',
          note: 'Uber ride',
          date: today,
          created_at: new Date(Date.now() - 2000).toISOString(),
        },
      ]
      localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(defaultTransactions))
      localStorage.setItem(GUEST_INITIALIZED_KEY, 'true')
      allTransactions = defaultTransactions
    }

    // Filter by date range
    const filtered = allTransactions.filter((tx) => {
      if (!tx.date || typeof tx.date !== 'string') return false
      return tx.date >= startDate && tx.date <= endDate
    })

    // Sort by date desc, then created_at desc
    filtered.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date)
      if (dateDiff !== 0) return dateDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    if (limit && limit > 0) {
      return filtered.slice(0, limit)
    }
    return filtered
  }

  async addTransaction(data: AddTransactionInput): Promise<Transaction> {
    const raw = localStorage.getItem(GUEST_TRANSACTIONS_KEY)
    let transactions: Transaction[] = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Transaction[]
        if (Array.isArray(parsed)) transactions = parsed
      } catch {
        transactions = []
      }
    }

    const newTx: Transaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      user_id: 'guest',
      amount: data.amount,
      type: data.type,
      category: data.category,
      category_id: data.categoryId,
      note: data.note,
      date: data.date,
      created_at: new Date().toISOString(),
    }

    transactions.push(newTx)
    localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(transactions))
    return newTx
  }

  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<void> {
    const raw = localStorage.getItem(GUEST_TRANSACTIONS_KEY)
    let transactions: Transaction[] = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Transaction[]
        if (Array.isArray(parsed)) transactions = parsed
      } catch {
        transactions = []
      }
    }

    const updated = transactions.map((tx) =>
      tx.id === id
        ? {
            ...tx,
            amount: data.amount,
            type: data.type,
            category: data.category,
            category_id: data.categoryId,
            note: data.note,
            date: data.date,
          }
        : tx
    )
    localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(updated))
  }

  async deleteTransaction(id: string): Promise<void> {
    const raw = localStorage.getItem(GUEST_TRANSACTIONS_KEY)
    if (raw) {
      try {
        const transactions: Transaction[] = JSON.parse(raw)
        if (Array.isArray(transactions)) {
          const filtered = transactions.filter((tx) => tx.id !== id)
          localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(filtered))
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  // -----------------------------------------------------------------------
  // Monthly Settings
  // -----------------------------------------------------------------------

  async getMonthlySettings(month: number, year: number): Promise<MonthlySettings | null> {
    const key = guestSettingsKey(year, month)
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = parseJSON<MonthlySettings>(raw)
      if (parsed) return parsed
    }

    const defaultSettings: MonthlySettings = {
      id: 'guest-settings',
      user_id: 'guest',
      income: 0,
      month,
      year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(key, JSON.stringify(defaultSettings))
    return defaultSettings
  }

  async upsertMonthlyIncome(
    value: number,
    month: number,
    year: number,
    existing: MonthlySettings | null
  ): Promise<MonthlySettings> {
    const key = guestSettingsKey(year, month)
    const newSettings: MonthlySettings = {
      id: existing?.id || 'guest-settings',
      user_id: 'guest',
      income: value,
      month,
      year,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(key, JSON.stringify(newSettings))
    return newSettings
  }

  // -----------------------------------------------------------------------
  // Categories
  // -----------------------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    const raw = localStorage.getItem(guestCategoriesKey())
    const initialized = localStorage.getItem(GUEST_INITIALIZED_KEY)
    let parseFailed = false

    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as Category[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {
        parseFailed = true
      }
    }

    if (initialized !== 'true' || raw === null || parseFailed) {
      const defaultCategories: Category[] = [
        { id: 'cat-food', user_id: 'guest', name: 'Food', type: 'expense', group_id: 'group-default', icon: '🍔', color: '#10B981', sort_order: 0, created_at: new Date().toISOString() },
        { id: 'cat-transport', user_id: 'guest', name: 'Transport', type: 'expense', group_id: 'group-default', icon: '🚗', color: '#3B82F6', sort_order: 1, created_at: new Date().toISOString() },
        { id: 'cat-utilities', user_id: 'guest', name: 'Utilities', type: 'expense', group_id: 'group-default', icon: '💡', color: '#F59E0B', sort_order: 2, created_at: new Date().toISOString() },
        { id: 'cat-entertainment', user_id: 'guest', name: 'Entertainment', type: 'expense', group_id: 'group-default', icon: '🎬', color: '#8B5CF6', sort_order: 3, created_at: new Date().toISOString() },
        { id: 'cat-shopping', user_id: 'guest', name: 'Shopping', type: 'expense', group_id: 'group-default', icon: '🛒', color: '#EC4899', sort_order: 4, created_at: new Date().toISOString() },
        { id: 'cat-health', user_id: 'guest', name: 'Health', type: 'expense', group_id: 'group-default', icon: '💊', color: '#EF4444', sort_order: 5, created_at: new Date().toISOString() },
        { id: 'cat-other', user_id: 'guest', name: 'Other', type: 'expense', group_id: 'group-default', icon: '📦', color: '#6B7280', sort_order: 6, created_at: new Date().toISOString() },
        { id: 'cat-salary', user_id: 'guest', name: 'Salary', type: 'income', group_id: 'group-income', icon: '💼', color: '#10B981', sort_order: 0, created_at: new Date().toISOString() },
        { id: 'cat-gift', user_id: 'guest', name: 'Gift', type: 'income', group_id: 'group-income', icon: '🎁', color: '#3B82F6', sort_order: 1, created_at: new Date().toISOString() },
      ]
      localStorage.setItem(guestCategoriesKey(), JSON.stringify(defaultCategories))
      localStorage.setItem(GUEST_INITIALIZED_KEY, 'true')
      return defaultCategories
    }
    return []
  }

  async createCategory(data: CategoryFormData): Promise<Category> {
    const raw = localStorage.getItem(guestCategoriesKey())
    const categories: Category[] = raw ? JSON.parse(raw) : []
    const newCat: Category = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      user_id: 'guest',
      name: data.name,
      type: data.type,
      group_id: data.group_id,
      icon: data.icon,
      color: data.color,
      sort_order: categories.length + 1,
      created_at: new Date().toISOString(),
    }
    categories.push(newCat)
    localStorage.setItem(guestCategoriesKey(), JSON.stringify(categories))
    return newCat
  }

  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
    const raw = localStorage.getItem(guestCategoriesKey())
    const categories: Category[] = raw ? JSON.parse(raw) : []
    const updated = categories.map((c) => (c.id === id ? { ...c, ...data } : c))
    localStorage.setItem(guestCategoriesKey(), JSON.stringify(updated))
    return updated.find((c) => c.id === id) as Category
  }

  async deleteCategory(id: string): Promise<void> {
    const raw = localStorage.getItem(guestCategoriesKey())
    const categories: Category[] = raw ? JSON.parse(raw) : []
    const updated = categories.filter((c) => c.id !== id)
    localStorage.setItem(guestCategoriesKey(), JSON.stringify(updated))
  }

  async reorderCategories(ordered: { id: string; sort_order: number }[]): Promise<void> {
    const raw = localStorage.getItem(guestCategoriesKey())
    const all: Category[] = raw ? JSON.parse(raw) : []
    const orderMap = new Map(ordered.map((c) => [c.id, c.sort_order]))
    const updated = all.map((c) => (orderMap.has(c.id) ? { ...c, sort_order: orderMap.get(c.id)! } : c))
    localStorage.setItem(guestCategoriesKey(), JSON.stringify(updated))
  }

  // -----------------------------------------------------------------------
  // Category Groups
  // -----------------------------------------------------------------------

  async listCategoryGroups(): Promise<CategoryGroup[]> {
    const raw = localStorage.getItem(guestCategoryGroupsKey())
    const initialized = localStorage.getItem(GUEST_INITIALIZED_KEY)
    let parseFailed = false

    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as CategoryGroup[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {
        parseFailed = true
      }
    }

    if (initialized !== 'true' || raw === null || parseFailed) {
      const defaultGroups: CategoryGroup[] = [
        { id: 'group-default', user_id: 'guest', name: 'Default', sort_order: 0, created_at: new Date().toISOString() },
        { id: 'group-income', user_id: 'guest', name: 'Income', sort_order: 1, created_at: new Date().toISOString() },
      ]
      localStorage.setItem(guestCategoryGroupsKey(), JSON.stringify(defaultGroups))
      localStorage.setItem(GUEST_INITIALIZED_KEY, 'true')
      return defaultGroups
    }
    return []
  }

  async createCategoryGroup(data: CategoryGroupFormData): Promise<CategoryGroup> {
    const raw = localStorage.getItem(guestCategoryGroupsKey())
    const groups: CategoryGroup[] = raw ? JSON.parse(raw) : []
    const newGroup: CategoryGroup = {
      id: 'group-' + Math.random().toString(36).substr(2, 9),
      user_id: 'guest',
      name: data.name,
      sort_order: groups.length + 1,
      created_at: new Date().toISOString(),
    }
    groups.push(newGroup)
    localStorage.setItem(guestCategoryGroupsKey(), JSON.stringify(groups))
    return newGroup
  }

  async updateCategoryGroup(id: string, data: Partial<CategoryGroupFormData>): Promise<CategoryGroup> {
    const raw = localStorage.getItem(guestCategoryGroupsKey())
    const groups: CategoryGroup[] = raw ? JSON.parse(raw) : []
    const updated = groups.map((g) => (g.id === id ? { ...g, ...data } : g))
    localStorage.setItem(guestCategoryGroupsKey(), JSON.stringify(updated))
    return updated.find((g) => g.id === id) as CategoryGroup
  }

  async deleteCategoryGroup(id: string): Promise<void> {
    const rawGroups = localStorage.getItem(guestCategoryGroupsKey())
    const groups: CategoryGroup[] = rawGroups ? JSON.parse(rawGroups) : []
    const updatedGroups = groups.filter((g) => g.id !== id)
    localStorage.setItem(guestCategoryGroupsKey(), JSON.stringify(updatedGroups))

    // Also ungroup categories in this group
    const rawCats = localStorage.getItem(guestCategoriesKey())
    const categories: Category[] = rawCats ? JSON.parse(rawCats) : []
    const updatedCats = categories.map((c) => (c.group_id === id ? { ...c, group_id: null } : c))
    localStorage.setItem(guestCategoriesKey(), JSON.stringify(updatedCats))
  }
}