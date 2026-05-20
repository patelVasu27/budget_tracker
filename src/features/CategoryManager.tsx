import { useState } from 'react'
import { X, Plus, Trash2, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'
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

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { user, isGuest } = useAuthStore()
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

  const activeUserId = isGuest ? 'guest' : user?.id
  const { data: categories = [] } = useCategories(activeUserId)
  const { data: groups = [] } = useCategoryGroups(activeUserId)
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()
  const createGroup = useCreateCategoryGroup()
  const deleteGroup = useDeleteCategoryGroup()

  if (!isOpen) return null

  const filteredCategories = categories.filter(c => c.type === categoryType)
  const groupedCategories = filteredCategories.filter(c => c.group_id)
  const ungroupedCategories = filteredCategories.filter(c => !c.group_id)

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
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
    if (!confirm('Delete this category? Transactions will be moved to "Other".')) return
    try {
      await deleteCategory.mutateAsync({ categoryId, userId: activeUserId })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      setError(errorMessage)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!activeUserId) return
    if (!confirm('Delete this group? Categories inside will become ungrouped.')) return
    try {
      await deleteGroup.mutateAsync({ groupId, userId: activeUserId })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group'
      setError(errorMessage)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-primary/20 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in border border-white/20 dark:border-white/5">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle dark:border-white/5">
          <h2 className="text-lg font-bold text-primary dark:text-[#E8ECE4] font-display">Manage Categories</h2>
          <button onClick={onClose} className="p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-accent-red/10 text-accent-red rounded-xl text-sm">{error}</div>
          )}

          {/* Category Type Toggle */}
          <div className="flex bg-[#EEF1EB] dark:bg-white/5 p-1 rounded-xl mb-2">
            <button
              type="button"
              onClick={() => setCategoryType('expense')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                categoryType === 'expense'
                  ? 'bg-accent-red text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Expense Categories
            </button>
            <button
              type="button"
              onClick={() => setCategoryType('income')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                categoryType === 'income'
                  ? 'bg-accent-green text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Income Categories
            </button>
          </div>

          {groups.map(group => (
            <div key={group.id} className="border border-border-subtle dark:border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-3 bg-[#F9FAF8] dark:bg-white/[0.02] hover:bg-[#EEF1EB] dark:hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-secondary dark:text-secondary/70" />
                  <span className="font-semibold text-primary dark:text-[#E8ECE4]">{group.name}</span>
                  <span className="text-xs text-secondary dark:text-secondary/70">
                    ({groupedCategories.filter(c => c.group_id === group.id).length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                    className="p-1.5 text-secondary/40 hover:text-accent-red hover:bg-accent-red/5 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="w-4 h-4 text-secondary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-secondary" />
                  )}
                </div>
              </button>
              {expandedGroups.has(group.id) && (
                <div className="p-3 space-y-2 bg-surface dark:bg-[#1B2A1E]">
                  {groupedCategories
                    .filter(c => c.group_id === group.id)
                    .map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAF8] dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon || '📦'}</span>
                          <span className="text-sm font-medium text-primary dark:text-[#E8ECE4]">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-secondary/40 hover:text-accent-red hover:bg-accent-red/5 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}

          {ungroupedCategories.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Ungrouped</h3>
              <div className="space-y-2">
                {ungroupedCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAF8] dark:hover:bg-white/5 border border-border-subtle dark:border-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon || '📦'}</span>
                      <span className="text-sm font-medium text-primary dark:text-[#E8ECE4]">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-secondary/40 hover:text-accent-red hover:bg-accent-red/5 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAddCategory && (
            <div className="p-4 bg-[#F9FAF8] dark:bg-white/[0.02] rounded-xl border border-accent-green/20 dark:border-accent-green/10 space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="input-field"
                maxLength={32}
                autoFocus
              />
              <div>
                <label className="text-xs font-bold uppercase text-secondary dark:text-secondary/70 mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-1">
                  {DEFAULT_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`w-8 h-8 text-lg rounded-lg transition-all ${
                        newCategoryIcon === icon ? 'bg-accent-green/20 ring-2 ring-accent-green' : 'hover:bg-primary/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-secondary dark:text-secondary/70 mb-1 block">Color</label>
                <div className="flex flex-wrap gap-1">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        newCategoryColor === color ? 'ring-2 ring-offset-2 ring-primary dark:ring-[#E8ECE4]' : ''
                      }`}
                      style={{ backgroundColor: color }}
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
                  >
                    <option value="">No group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowAddCategory(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddCategory} className="btn-primary flex-1" disabled={!newCategoryName.trim()}>
                  Add
                </button>
              </div>
            </div>
          )}

          {showAddGroup && (
            <div className="p-4 bg-[#F9FAF8] dark:bg-white/[0.02] rounded-xl border border-accent-green/20 dark:border-accent-green/10 space-y-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="input-field"
                maxLength={32}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddGroup(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddGroup} className="btn-primary flex-1" disabled={!newGroupName.trim()}>
                  Add Group
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-subtle dark:border-white/5 flex gap-3">
          <button
            onClick={() => setShowAddGroup(true)}
            className="btn-secondary flex items-center gap-2"
            disabled={showAddCategory || showAddGroup}
          >
            <Plus className="w-4 h-4" />
            Add Group
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="btn-primary flex items-center gap-2"
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