import { supabase } from '../lib/supabase'
import type { Transaction, MonthlySettings, Category, CategoryGroup } from '../types'
import type { CategoryFormData, CategoryGroupFormData } from '../types'
import type { DataStore, AddTransactionInput, UpdateTransactionInput } from './dataStore'

export class RemoteStore implements DataStore {
  constructor(private userId: string) {}

  // -----------------------------------------------------------------------
  // Transactions
  // -----------------------------------------------------------------------

  async listTransactions(startDate: string, endDate: string, _allowSeed?: boolean, limit?: number): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (limit && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    const rows = (data as Transaction[]) || []

    // Secondary sort by created_at desc (matches original behavior)
    rows.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date)
      if (dateDiff !== 0) return dateDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return rows
  }

  async addTransaction(data: AddTransactionInput): Promise<Transaction> {
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
    const categoryIdToSend = data.categoryId && isUuid(data.categoryId) ? data.categoryId : null

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert({
        user_id: this.userId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        category_id: categoryIdToSend,
        note: data.note,
        date: data.date,
      })
      .select()
      .single()

    if (error) throw error
    return inserted as Transaction
  }

  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<void> {
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
    const categoryIdToSend = data.categoryId && isUuid(data.categoryId) ? data.categoryId : null

    const { error } = await supabase
      .from('transactions')
      .update({
        amount: data.amount,
        type: data.type,
        category: data.category,
        category_id: categoryIdToSend,
        note: data.note,
        date: data.date,
      })
      .eq('id', id)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  // -----------------------------------------------------------------------
  // Monthly Settings
  // -----------------------------------------------------------------------

  async getMonthlySettings(month: number, year: number): Promise<MonthlySettings | null> {
    const { data, error } = await supabase
      .from('monthly_settings')
      .select('*')
      .eq('user_id', this.userId)
      .eq('month', month)
      .eq('year', year)
      // maybeSingle() returns 200 with null when no row exists, instead of
      // .single() which returns 406 (PostgREST "JSON object requested, no
      // rows returned"). No settings for a month is the normal case.
      .maybeSingle()

    if (error) throw error
    return (data as MonthlySettings) || null
  }

  async upsertMonthlyIncome(
    value: number,
    month: number,
    year: number,
    existing: MonthlySettings | null
  ): Promise<MonthlySettings> {
    if (existing) {
      const { error } = await supabase
        .from('monthly_settings')
        .update({ income: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', this.userId)

      if (error) throw error
      return { ...existing, income: value, updated_at: new Date().toISOString() }
    } else {
      const { data, error } = await supabase
        .from('monthly_settings')
        .insert({
          user_id: this.userId,
          income: value,
          month,
          year,
        })
        .select()
        .single()

      if (error) throw error
      return data as MonthlySettings
    }
  }

  // -----------------------------------------------------------------------
  // Categories
  // -----------------------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', this.userId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Category[]) || []
  }

  async createCategory(data: CategoryFormData): Promise<Category> {
    const maxSortOrder = await this.getMaxSortOrder()
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: this.userId,
        name: data.name,
        type: data.type,
        group_id: data.group_id,
        icon: data.icon,
        color: data.color,
        sort_order: maxSortOrder + 1,
      })
      .select()
      .single()

    if (error) throw error
    return category as Category
  }

  private async getMaxSortOrder(): Promise<number> {
    const { data } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('user_id', this.userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      return (data[0] as { sort_order: number }).sort_order
    }
    return 0
  }

  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) throw error
    return category as Category
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  async reorderCategories(ordered: { id: string; sort_order: number }[]): Promise<void> {
    for (let i = 0; i < ordered.length; i++) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: ordered[i].sort_order })
        .eq('id', ordered[i].id)
        .eq('user_id', this.userId)
      if (error) throw error
    }
  }

  // -----------------------------------------------------------------------
  // Category Groups
  // -----------------------------------------------------------------------

  async listCategoryGroups(): Promise<CategoryGroup[]> {
    const { data, error } = await supabase
      .from('category_groups')
      .select('*')
      .eq('user_id', this.userId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as CategoryGroup[]) || []
  }

  async createCategoryGroup(data: CategoryGroupFormData): Promise<CategoryGroup> {
    const maxSortOrder = await this.getMaxGroupSortOrder()
    const { data: group, error } = await supabase
      .from('category_groups')
      .insert({
        user_id: this.userId,
        name: data.name,
        sort_order: maxSortOrder + 1,
      })
      .select()
      .single()

    if (error) throw error
    return group as CategoryGroup
  }

  private async getMaxGroupSortOrder(): Promise<number> {
    const { data } = await supabase
      .from('category_groups')
      .select('sort_order')
      .eq('user_id', this.userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      return (data[0] as { sort_order: number }).sort_order
    }
    return 0
  }

  async updateCategoryGroup(id: string, data: Partial<CategoryGroupFormData>): Promise<CategoryGroup> {
    const { data: group, error } = await supabase
      .from('category_groups')
      .update(data)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) throw error
    return group as CategoryGroup
  }

  async deleteCategoryGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('category_groups')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)

    if (error) throw error
  }
}