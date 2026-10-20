import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import type { Category, CategoryFormData, CategoryGroupFormData, CategoryPickerItem } from '../types'

export function useCategories(userId: string | undefined) {
  const { isGuest } = useAuthStore()
  const store = useDataStore()
  const activeUserId = isGuest ? 'guest' : userId
  return useQuery({
    queryKey: ['categories', activeUserId],
    queryFn: async () => {
      if (!store) return []
      return store.listCategories()
    },
    enabled: !!store,
  })
}

export function useCategoryGroups(userId: string | undefined) {
  const { isGuest } = useAuthStore()
  const store = useDataStore()
  const activeUserId = isGuest ? 'guest' : userId
  return useQuery({
    queryKey: ['categoryGroups', activeUserId],
    queryFn: async () => {
      if (!store) return []
      return store.listCategoryGroups()
    },
    enabled: !!store,
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
  const store = useDataStore()
  return useMutation({
    mutationFn: async ({ data }: { userId: string; data: CategoryFormData }) => {
      if (!store) throw new Error('No data store available')
      return store.createCategory(data)
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const store = useDataStore()
  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: Partial<CategoryFormData>; userId: string }) => {
      if (!store) throw new Error('No data store available')
      return store.updateCategory(categoryId, data)
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const store = useDataStore()
  return useMutation({
    mutationFn: async ({ categoryId }: { categoryId: string; userId: string }) => {
      if (!store) throw new Error('No data store available')
      return store.deleteCategory(categoryId)
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })
}

export function useCreateCategoryGroup() {
  const queryClient = useQueryClient()
  const store = useDataStore()
  return useMutation({
    mutationFn: async ({ data }: { userId: string; data: CategoryGroupFormData }) => {
      if (!store) throw new Error('No data store available')
      return store.createCategoryGroup(data)
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGroups', userId] })
    },
  })
}

export function useUpdateCategoryGroup() {
  const queryClient = useQueryClient()
  const store = useDataStore()
  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: Partial<CategoryGroupFormData>; userId: string }) => {
      if (!store) throw new Error('No data store available')
      return store.updateCategoryGroup(groupId, data)
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGroups', userId] })
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

export function useDeleteCategoryGroup() {
  const queryClient = useQueryClient()
  const store = useDataStore()
  return useMutation({
    mutationFn: async ({ groupId }: { groupId: string; userId: string }) => {
      if (!store) throw new Error('No data store available')
      return store.deleteCategoryGroup(groupId)
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGroups', userId] })
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })
}

