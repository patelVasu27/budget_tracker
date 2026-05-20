import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Category, CategoryGroup, CategoryFormData, CategoryGroupFormData, CategoryPickerItem } from '../types'

export function useCategories(userId: string | undefined) {
  const { isGuest } = useAuthStore()
  const activeUserId = isGuest ? 'guest' : userId
  return useQuery({
    queryKey: ['categories', activeUserId],
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem('guest_categories')
        const initialized = localStorage.getItem('guest_initialized')
        let parseFailed = false
        if (local !== null) {
          try {
            const parsed = JSON.parse(local) as Category[]
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
          } catch (e) {
            console.error('Failed to parse categories:', e)
            parseFailed = true
          }
        }
        
        if (initialized !== 'true' || local === null || parseFailed) {
          // Seed default guest categories matching schema-v2-categories.sql
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
          localStorage.setItem('guest_categories', JSON.stringify(defaultCategories))
          localStorage.setItem('guest_initialized', 'true')
          return defaultCategories
        }
        return []
      }
      if (!userId) return []
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data as Category[]) || []
    },
    enabled: !!activeUserId,
  })
}

export function useCategoryGroups(userId: string | undefined) {
  const { isGuest } = useAuthStore()
  const activeUserId = isGuest ? 'guest' : userId
  return useQuery({
    queryKey: ['categoryGroups', activeUserId],
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem('guest_category_groups')
        const initialized = localStorage.getItem('guest_initialized')
        let parseFailed = false
        if (local !== null) {
          try {
            const parsed = JSON.parse(local) as CategoryGroup[]
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
          } catch (e) {
            console.error('Failed to parse category groups:', e)
            parseFailed = true
          }
        }

        if (initialized !== 'true' || local === null || parseFailed) {
          // Seed default groups matching schema-v2-categories.sql
          const defaultGroups: CategoryGroup[] = [
            { id: 'group-default', user_id: 'guest', name: 'Default', sort_order: 0, created_at: new Date().toISOString() },
            { id: 'group-income', user_id: 'guest', name: 'Income', sort_order: 1, created_at: new Date().toISOString() }
          ]
          localStorage.setItem('guest_category_groups', JSON.stringify(defaultGroups))
          localStorage.setItem('guest_initialized', 'true')
          return defaultGroups
        }
        return []
      }
      if (!userId) return []
      const { data, error } = await supabase
        .from('category_groups')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data as CategoryGroup[]) || []
    },
    enabled: !!activeUserId,
  })
}

export function useCategoryPickerData(userId: string | undefined, type?: 'expense' | 'income') {
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(userId)
  const { data: groups = [], isLoading: isLoadingGroups } = useCategoryGroups(userId)

  const filteredCategories = type ? categories.filter(c => c.type === type) : categories

  const grouped: CategoryPickerItem[] = []
  const ungrouped: Category[] = []

  filteredCategories.forEach(cat => {
    if (cat.group_id) {
      const groupItem = grouped.find(g => g.group?.id === cat.group_id)
      if (groupItem) {
        groupItem.categories.push(cat)
      } else {
        const group = groups.find(g => g.id === cat.group_id)
        grouped.push({
          group: group || null,
          categories: [cat]
        })
      }
    } else {
      ungrouped.push(cat)
    }
  })

  return {
    grouped,
    ungrouped,
    allCategories: filteredCategories,
    allGroups: groups,
    isLoading: isLoadingCategories || isLoadingGroups,
  }
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: CategoryFormData }) => {
      if (userId === 'guest') {
        const local = localStorage.getItem('guest_categories')
        const categories: Category[] = local ? JSON.parse(local) : []
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
        localStorage.setItem('guest_categories', JSON.stringify(categories))
        return newCat
      }
      const maxSortOrder = await getMaxSortOrder(userId)
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
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
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, data, userId }: { categoryId: string; data: Partial<CategoryFormData>; userId: string }) => {
      if (userId === 'guest') {
        const local = localStorage.getItem('guest_categories')
        const categories: Category[] = local ? JSON.parse(local) : []
        const updated = categories.map(c => c.id === categoryId ? { ...c, ...data } : c)
        localStorage.setItem('guest_categories', JSON.stringify(updated))
        return updated.find(c => c.id === categoryId) as Category
      }
      const { data: category, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', categoryId)
        .select()
        .single()

      if (error) throw error
      return category as Category
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, userId }: { categoryId: string; userId: string }) => {
      if (userId === 'guest') {
        const local = localStorage.getItem('guest_categories')
        const categories: Category[] = local ? JSON.parse(local) : []
        const updated = categories.filter(c => c.id !== categoryId)
        localStorage.setItem('guest_categories', JSON.stringify(updated))
        return
      }
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })
}

export function useCreateCategoryGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: CategoryGroupFormData }) => {
      if (userId === 'guest') {
        const local = localStorage.getItem('guest_category_groups')
        const groups: CategoryGroup[] = local ? JSON.parse(local) : []
        const newGroup: CategoryGroup = {
          id: 'group-' + Math.random().toString(36).substr(2, 9),
          user_id: 'guest',
          name: data.name,
          sort_order: groups.length + 1,
          created_at: new Date().toISOString(),
        }
        groups.push(newGroup)
        localStorage.setItem('guest_category_groups', JSON.stringify(groups))
        return newGroup
      }
      const maxSortOrder = await getMaxGroupSortOrder(userId)
      const { data: group, error } = await supabase
        .from('category_groups')
        .insert({
          user_id: userId,
          name: data.name,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single()

      if (error) throw error
      return group as CategoryGroup
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGroups', userId] })
    },
  })
}

export function useUpdateCategoryGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, data, userId }: { groupId: string; data: Partial<CategoryGroupFormData>; userId: string }) => {
      if (userId === 'guest') {
        const local = localStorage.getItem('guest_category_groups')
        const groups: CategoryGroup[] = local ? JSON.parse(local) : []
        const updated = groups.map(g => g.id === groupId ? { ...g, ...data } : g)
        localStorage.setItem('guest_category_groups', JSON.stringify(updated))
        return updated.find(g => g.id === groupId) as CategoryGroup
      }
      const { data: group, error } = await supabase
        .from('category_groups')
        .update(data)
        .eq('id', groupId)
        .select()
        .single()

      if (error) throw error
      return group as CategoryGroup
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGroups', userId] })
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

export function useDeleteCategoryGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      if (userId === 'guest') {
        const localGroups = localStorage.getItem('guest_category_groups')
        const groups: CategoryGroup[] = localGroups ? JSON.parse(localGroups) : []
        const updatedGroups = groups.filter(g => g.id !== groupId)
        localStorage.setItem('guest_category_groups', JSON.stringify(updatedGroups))

        // Also update categories in this group to be ungrouped!
        const localCats = localStorage.getItem('guest_categories')
        const categories: Category[] = localCats ? JSON.parse(localCats) : []
        const updatedCats = categories.map(c => c.group_id === groupId ? { ...c, group_id: null } : c)
        localStorage.setItem('guest_categories', JSON.stringify(updatedCats))
        return
      }
      const { error } = await supabase
        .from('category_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGroups', userId] })
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

async function getMaxSortOrder(userId: string): Promise<number> {
  const { data } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  return data?.sort_order ?? 0
}

async function getMaxGroupSortOrder(userId: string): Promise<number> {
  const { data } = await supabase
    .from('category_groups')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  return data?.sort_order ?? 0
}