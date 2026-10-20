import type { Transaction, MonthlySettings, Category, CategoryGroup } from '../types'
import type { CategoryFormData, CategoryGroupFormData } from '../types'
import type { DataStore, AddTransactionInput, UpdateTransactionInput } from './dataStore'

const API_BASE = ''

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE}/api${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.headers) {
    const extraHeaders = options.headers as Record<string, string>
    for (const key of Object.keys(extraHeaders)) {
      headers[key] = extraHeaders[key]
    }
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const error = new Error(errorBody.error || `Request failed: ${response.status}`) as Error & {
      status?: number
      code?: string
    }
    error.status = response.status
    error.code = errorBody.code
    throw error
  }

  return response
}

export class RemoteStoreV2 implements DataStore {
  constructor(private userId: string) {}

  // -----------------------------------------------------------------------
  // Transactions
  // -----------------------------------------------------------------------

  async listTransactions(
    startDate: string,
    endDate: string,
    _allowSeed?: boolean,
    limit?: number
  ): Promise<Transaction[]> {
    const params = new URLSearchParams({ start: startDate, end: endDate })
    if (limit && limit > 0) params.set('limit', String(limit))

    const response = await apiFetch(`/transactions?${params}`, {
      method: 'GET',
    })

    const data = (await response.json()) as Transaction[]
    return data || []
  }

  async addTransaction(data: AddTransactionInput): Promise<Transaction> {
    const response = await apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        type: data.type,
        category: data.category,
        category_id: data.categoryId,
        note: data.note,
        date: data.date,
      }),
    })

    return (await response.json()) as Transaction
  }

  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<void> {
    await apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: data.amount,
        type: data.type,
        category: data.category,
        category_id: data.categoryId,
        note: data.note,
        date: data.date,
      }),
    })
  }

  async deleteTransaction(id: string): Promise<void> {
    await apiFetch(`/transactions/${id}`, {
      method: 'DELETE',
    })
  }

  // -----------------------------------------------------------------------
  // Monthly Settings
  // -----------------------------------------------------------------------

  async getMonthlySettings(month: number, year: number): Promise<MonthlySettings | null> {
    const response = await apiFetch(
      `/monthly-settings?month=${month}&year=${year}`,
      { method: 'GET' }
    )

    const data = (await response.json()) as MonthlySettings | null
    return data || null
  }

  async upsertMonthlyIncome(
    value: number,
    month: number,
    year: number,
    _existing: MonthlySettings | null
  ): Promise<MonthlySettings> {
    const response = await apiFetch('/monthly-settings', {
      method: 'PUT',
      body: JSON.stringify({
        user_id: this.userId,
        income: value,
        month,
        year,
      }),
    })

    return (await response.json()) as MonthlySettings
  }

  // -----------------------------------------------------------------------
  // Categories
  // -----------------------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    const response = await apiFetch('/categories', { method: 'GET' })
    const data = (await response.json()) as Category[]
    return data || []
  }

  async createCategory(data: CategoryFormData): Promise<Category> {
    const response = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        group_id: data.group_id,
        icon: data.icon,
        color: data.color,
      }),
    })

    return (await response.json()) as Category
  }

  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    return (await response.json()) as Category
  }

  async deleteCategory(id: string): Promise<void> {
    await apiFetch(`/categories/${id}`, { method: 'DELETE' })
  }

  async reorderCategories(ordered: { id: string; sort_order: number }[]): Promise<void> {
    await apiFetch('/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ordered }),
    })
  }

  // -----------------------------------------------------------------------
  // Category Groups
  // -----------------------------------------------------------------------

  async listCategoryGroups(): Promise<CategoryGroup[]> {
    const response = await apiFetch('/category-groups', { method: 'GET' })
    const data = (await response.json()) as CategoryGroup[]
    return data || []
  }

  async createCategoryGroup(data: CategoryGroupFormData): Promise<CategoryGroup> {
    const response = await apiFetch('/category-groups', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
      }),
    })

    return (await response.json()) as CategoryGroup
  }

  async updateCategoryGroup(id: string, data: Partial<CategoryGroupFormData>): Promise<CategoryGroup> {
    const response = await apiFetch(`/category-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    return (await response.json()) as CategoryGroup
  }

  async deleteCategoryGroup(id: string): Promise<void> {
    await apiFetch(`/category-groups/${id}`, { method: 'DELETE' })
  }
}