import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Category, CategoryGroup, CategoryFormData, CategoryGroupFormData, CategoryPickerItem } from '../types'

export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data as Category[]) || []
    },
    enabled: !!userId,
  })
}

export function useCategoryGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['categoryGroups', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('category_groups')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data as CategoryGroup[]) || []
    },
    enabled: !!userId,
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
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: Partial<CategoryFormData>; userId: string }) => {
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
    mutationFn: async ({ categoryId }: { categoryId: string; userId: string }) => {
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
    mutationFn: async ({ groupId, data }: { groupId: string; data: Partial<CategoryGroupFormData>; userId: string }) => {
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
    mutationFn: async ({ groupId }: { groupId: string; userId: string }) => {
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