import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, FolderOpen, ChevronDown, ChevronRight, Search, GripVertical, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import {
  useCategories,
  useCategoryGroups,
  useCreateCategory,
  useDeleteCategory,
  useCreateCategoryGroup,
  useDeleteCategoryGroup,
} from '../hooks/useCategories'
import { DEFAULT_ICONS, DEFAULT_COLORS } from '../types'
import type { Category } from '../types'

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { user, isGuest } = useAuthStore()
  const queryClient = useQueryClient()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryGroup, setNewCategoryGroup] = useState<string | null>(null)
  const [newCategoryIcon, setNewCategoryIcon] = useState<string | null>(null)
  const [newCategoryColor, setNewCategoryColor] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [error, setError] = useState('')
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const activeUserId = isGuest ? 'guest' : user?.id
  const { data: categories = [] } = useCategories(activeUserId)
  const { data: groups = [] } = useCategoryGroups(activeUserId)
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()
  const createGroup = useCreateCategoryGroup()
  const deleteGroup = useDeleteCategoryGroup()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Default expand all groups on open / type change
  useEffect(() => {
    if (isOpen && groups.length > 0) {
      setExpandedGroups(new Set(groups.map(g => g.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, groups.length])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setConfirmDeleteId(null)
      setConfirmDeleteGroupId(null)
      setShowAddCategory(false)
      setShowAddGroup(false)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredCategories = categories.filter(c => c.type === categoryType)
  const q = searchQuery.trim().toLowerCase()
  const matchesSearch = (name: string) => !q || name.toLowerCase().includes(q)

  const visibleCategories = filteredCategories
    .filter(c => matchesSearch(c.name))
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const groupedCategories = visibleCategories.filter(c => c.group_id)
  const ungroupedCategories = visibleCategories.filter(c => !c.group_id)

  const expenseCount = categories.filter(c => c.type === 'expense').length
  const incomeCount = categories.filter(c => c.type === 'income').length

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const persistCategoryOrder = async (ordered: Category[]) => {
    if (!activeUserId) return
    setIsReordering(true)
    try {
      if (activeUserId === 'guest') {
        const local = localStorage.getItem('guest_categories')
        const all: Category[] = local ? JSON.parse(local) : []
        const orderMap = new Map(ordered.map((c, idx) => [c.id, idx]))
        const updated = all.map(c => orderMap.has(c.id) ? { ...c, sort_order: orderMap.get(c.id)! } : c)
        localStorage.setItem('guest_categories', JSON.stringify(updated))
      } else {
        for (let i = 0; i < ordered.length; i++) {
          await supabase.from('categories').update({ sort_order: i }).eq('id', ordered[i].id)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['categories', activeUserId] })
    } catch (e) {
      console.error('Reorder failed:', e)
    } finally {
      setIsReordering(false)
    }
  }

  const moveCategory = (categoryId: string, direction: -1 | 1) => {
    const idx = visibleCategories.findIndex(c => c.id === categoryId)
    if (idx < 0) return
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= visibleCategories.length) return
    const next = visibleCategories.slice()
    const [moved] = next.splice(idx, 1)
    next.splice(nextIdx, 0, moved)
    persistCategoryOrder(next)
  }

  const handleDropOnCategory = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    const fromIdx = visibleCategories.findIndex(c => c.id === draggedId)
    const toIdx = visibleCategories.findIndex(c => c.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const next = visibleCategories.slice()
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setDraggedId(null)
    persistCategoryOrder(next)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !activeUserId) return
    setError('')
    try {
      await createCategory.mutateAsync({
        userId: activeUserId,
        data: {
          name: newCategoryName.trim(),
          type: categoryType,
          group_id: newCategoryGroup,
          icon: newCategoryIcon,
          color: newCategoryColor,
        },
      })
      setNewCategoryName('')
      setNewCategoryGroup(null)
      setNewCategoryIcon(null)
      setNewCategoryColor(null)
      setShowAddCategory(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category'
      setError(errorMessage)
    }
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !activeUserId) return
    setError('')
    try {
      await createGroup.mutateAsync({
        userId: activeUserId,
        data: { name: newGroupName.trim() },
      })
      setNewGroupName('')
      setShowAddGroup(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group'
      setError(errorMessage)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!activeUserId) return
    if (confirmDeleteId !== categoryId) {
      setConfirmDeleteId(categoryId)
      setTimeout(() => setConfirmDeleteId(current => current === categoryId ? null : current), 4000)
      return
    }
    try {
      setConfirmDeleteId(null)
      await deleteCategory.mutateAsync({ categoryId, userId: activeUserId })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      setError(errorMessage)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!activeUserId) return
    if (confirmDeleteGroupId !== groupId) {
      setConfirmDeleteGroupId(groupId)
      setTimeout(() => setConfirmDeleteGroupId(current => current === groupId ? null : current), 4000)
      return
    }
    try {
      setConfirmDeleteGroupId(null)
      await deleteGroup.mutateAsync({ groupId, userId: activeUserId })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group'
      setError(errorMessage)
    }
  }

  const renderCategoryRow = (cat: Category, index: number) => {
    const isConfirming = confirmDeleteId === cat.id
    return (
      <div
        key={cat.id}
        draggable
        onDragStart={() => setDraggedId(cat.id)}
        onDragEnd={() => setDraggedId(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDropOnCategory(cat.id)}
        className={`group flex items-center gap-2 min-h-[44px] p-2 rounded-xl border transition-all duration-200 animate-stagger-in ${
          draggedId === cat.id ? 'opacity-50 border-accent-green border-dashed bg-accent-green/5' : 'border-border-subtle dark:border-white/5 hover:bg-[#F9FAF8] dark:hover:bg-white/5'
        }`}
        style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
      >
        <span
          className="p-1.5 text-secondary/40 cursor-grab active:cursor-grabbing touch-none"
          aria-hidden="true"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
          style={{
            backgroundColor: cat.color ? `${cat.color}14` : undefined,
            borderColor: cat.color ? `${cat.color}30` : undefined,
          }}
        >
          {cat.icon || '📦'}
        </span>
        <span className="text-sm font-medium text-primary dark:text-[#E8ECE4] flex-1 truncate">{cat.name}</span>

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => moveCategory(cat.id, -1)}
            className="p-2 text-secondary/50 hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 rounded-lg"
            aria-label={`Move ${cat.name} up`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => moveCategory(cat.id, 1)}
            className="p-2 text-secondary/50 hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 rounded-lg"
            aria-label={`Move ${cat.name} down`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteCategory(cat.id)}
            className={`p-2 rounded-lg transition-all min-w-[36px] min-h-[36px] ${
              isConfirming
                ? 'bg-accent-red text-white hover:bg-[#C24E2E]'
                : 'text-secondary/40 hover:text-accent-red hover:bg-accent-red/5'
            }`}
            aria-label={isConfirming ? `Confirm delete ${cat.name}` : `Delete ${cat.name}`}
          >
            {isConfirming ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Manage categories">
      <div className="absolute inset-0 bg-primary/20 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div ref={modalRef} className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-lg max-h-[85vh] flex flex-col animate-scale-in border border-white/20 dark:border-white/5">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle dark:border-white/5">
          <div>
            <h2 className="text-lg font-bold text-primary dark:text-[#E8ECE4] font-display">Manage Categories</h2>
            <p className="text-xs text-secondary dark:text-secondary/70 mt-0.5">Drag to reorder{isReordering ? ' • saving…' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 min-w-[40px] min-h-[40px] text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg" aria-label="Close category manager">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-accent-red/10 text-accent-red rounded-xl text-sm" role="alert">{error}</div>
          )}

          <div className="flex bg-[#EEF1EB] dark:bg-white/5 p-1 rounded-full" role="tablist" aria-label="Category type">
            <button
              type="button"
              role="tab"
              aria-selected={categoryType === 'expense'}
              onClick={() => setCategoryType('expense')}
              className={`flex-1 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 ${
                categoryType === 'expense'
                  ? 'bg-accent-red text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Expense ({expenseCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={categoryType === 'income'}
              onClick={() => setCategoryType('income')}
              className={`flex-1 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 ${
                categoryType === 'income'
                  ? 'bg-accent-green text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Income ({incomeCount})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-sm"
              placeholder="Search categories"
              aria-label="Search categories"
            />
          </div>

          {groups.map(group => {
            const catsInGroup = groupedCategories.filter(c => c.group_id === group.id)
            if (q && catsInGroup.length === 0) return null
            const isExpanded = expandedGroups.has(group.id)
            const isConfirmingGroup = confirmDeleteGroupId === group.id
            return (
              <div key={group.id} className="border border-border-subtle dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="w-full flex items-center justify-between p-3 bg-[#F9FAF8] dark:bg-white/[0.02] hover:bg-[#EEF1EB] dark:hover:bg-white/[0.05] transition-colors">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2 flex-1 min-h-[44px] text-left"
                    aria-expanded={isExpanded}
                  >
                    <FolderOpen className="w-4 h-4 text-secondary dark:text-secondary/70 flex-shrink-0" />
                    <span className="font-semibold text-primary dark:text-[#E8ECE4]">{group.name}</span>
                    <span className="text-xs text-secondary dark:text-secondary/70">
                      ({catsInGroup.length})
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className={`p-2 rounded-lg min-w-[36px] min-h-[36px] ${isConfirmingGroup ? 'bg-accent-red text-white' : 'text-secondary/40 hover:text-accent-red hover:bg-accent-red/5'}`}
                      aria-label={isConfirmingGroup ? `Confirm delete group ${group.name}` : `Delete group ${group.name}`}
                    >
                      {isConfirmingGroup ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="p-2 text-secondary"
                      aria-label={isExpanded ? `Collapse ${group.name}` : `Expand ${group.name}`}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-3 space-y-2 bg-surface dark:bg-[#1B2A1E]">
                    {catsInGroup.length === 0 ? (
                      <p className="text-sm text-secondary/60 text-center py-3">No categories in this group.</p>
                    ) : (
                      catsInGroup.map((cat, idx) => renderCategoryRow(cat, idx))
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {ungroupedCategories.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Ungrouped</h3>
              <div className="space-y-2">
                {ungroupedCategories.map((cat, idx) => renderCategoryRow(cat, idx))}
              </div>
            </div>
          )}

          {visibleCategories.length === 0 && (
            <p className="text-sm text-secondary text-center py-6">No {categoryType} categories{q ? ` match “${searchQuery}”` : ' yet'}.</p>
          )}

          {showAddCategory && (
            <div className="p-4 bg-[#F9FAF8] dark:bg-white/[0.02] rounded-2xl border border-accent-green/20 dark:border-accent-green/10 space-y-3 animate-scale-in">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="input-field"
                maxLength={32}
                autoFocus
                aria-label="New category name"
              />
              <div>
                <label className="text-xs font-bold uppercase text-secondary dark:text-secondary/70 mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-1">
                  {DEFAULT_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] text-lg rounded-xl transition-all flex items-center justify-center ${
                        newCategoryIcon === icon ? 'bg-accent-green/20 ring-2 ring-accent-green' : 'hover:bg-primary/5 dark:hover:bg-white/5'
                      }`}
                      aria-pressed={newCategoryIcon === icon}
                      aria-label={`Select icon ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-secondary dark:text-secondary/70 mb-1 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-full transition-all flex items-center justify-center ${
                        newCategoryColor === color ? 'ring-2 ring-offset-2 ring-primary dark:ring-[#E8ECE4]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-pressed={newCategoryColor === color}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
              {groups.length > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase text-secondary dark:text-secondary/70 mb-1 block">Group (optional)</label>
                  <select
                    value={newCategoryGroup || ''}
                    onChange={(e) => setNewCategoryGroup(e.target.value || null)}
                    className="input-field"
                    aria-label="Select group"
                  >
                    <option value="">No group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddCategory(false)} className="btn-secondary flex-1 min-h-[44px]">Cancel</button>
                <button type="button" onClick={handleAddCategory} className="btn-primary flex-1 min-h-[44px]" disabled={!newCategoryName.trim()}>
                  Add
                </button>
              </div>
            </div>
          )}

          {showAddGroup && (
            <div className="p-4 bg-[#F9FAF8] dark:bg-white/[0.02] rounded-2xl border border-accent-green/20 dark:border-accent-green/10 space-y-3 animate-scale-in">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="input-field"
                maxLength={32}
                autoFocus
                aria-label="New group name"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddGroup(false)} className="btn-secondary flex-1 min-h-[44px]">Cancel</button>
                <button type="button" onClick={handleAddGroup} className="btn-primary flex-1 min-h-[44px]" disabled={!newGroupName.trim()}>
                  Add Group
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-subtle dark:border-white/5 flex gap-3">
          <button
            type="button"
            onClick={() => { setShowAddGroup(true); setShowAddCategory(false) }}
            className="btn-secondary flex-1 min-h-[44px] flex items-center justify-center gap-2"
            disabled={showAddCategory || showAddGroup}
          >
            <Plus className="w-4 h-4" />
            Add Group
          </button>
          <button
            type="button"
            onClick={() => { setShowAddCategory(true); setShowAddGroup(false) }}
            className="btn-primary flex-1 min-h-[44px] flex items-center justify-center gap-2"
            disabled={showAddCategory || showAddGroup}
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>
    </div>
  )
}
