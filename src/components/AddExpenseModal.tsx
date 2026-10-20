import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import { useCategoryPickerData } from '../hooks/useCategories'
import type { Transaction } from '../types'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  editTransaction?: Transaction | null
  voicePrefill?: { amount: number; category: string; note: string; type?: 'expense' | 'income' } | null
  currentBalance?: number
}

interface ExpenseForm {
  amount: string
  categoryId: string
  note: string
  date: string
}

export function AddExpenseModal({ isOpen, onClose, editTransaction, voicePrefill, currentBalance }: AddExpenseModalProps) {
  const { user, isGuest } = useAuthStore()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'custom'>('today')

  const activeUserId = isGuest ? 'guest' : user?.id
  const store = useDataStore()
  const { grouped, ungrouped, allCategories, isLoading } = useCategoryPickerData(activeUserId, transactionType)

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ExpenseForm>({
    defaultValues: {
      amount: '',
      categoryId: '',
      note: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  })

  const selectedCategoryId = watch('categoryId')
  const watchedAmount = watch('amount')
  const watchedDate = watch('date')
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLInputElement | null>(null)

  const { ref: amountRef, ...amountRegister } = register('amount', {
    required: 'Amount is required',
    min: { value: 0.01, message: 'Amount must be greater than 0' }
  })

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      setTimeout(() => firstFocusableRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Setup form once when modal opens
  useEffect(() => {
    if (!isOpen) return
    setCategoryQuery('')
    setDatePreset('today')

    if (editTransaction) {
      setTransactionType(editTransaction.type || 'expense')
      const d = editTransaction.date
      if (d === todayStr) setDatePreset('today')
      else if (d === yesterdayStr) setDatePreset('yesterday')
      else setDatePreset('custom')
      reset({
        amount: editTransaction.amount.toString(),
        categoryId: editTransaction.category_id || '',
        note: editTransaction.note || '',
        date: editTransaction.date,
      })
    } else if (voicePrefill) {
      setTransactionType(voicePrefill.type || 'expense')
      reset({
        amount: voicePrefill.amount > 0 ? voicePrefill.amount.toString() : '',
        categoryId: '',
        note: voicePrefill.note,
        date: format(new Date(), 'yyyy-MM-dd'),
      })
    } else {
      setTransactionType('expense')
      reset({
        amount: '',
        categoryId: '',
        note: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
    }
  }, [isOpen, editTransaction, voicePrefill, reset, todayStr, yesterdayStr])

  // Set default category when categories load or selection is missing
  useEffect(() => {
    if (isOpen && allCategories.length > 0 && !selectedCategoryId) {
      if (editTransaction) {
        setValue('categoryId', editTransaction.category_id || allCategories.find(c => c.name === editTransaction.category)?.id || allCategories[0].id)
      } else if (voicePrefill) {
        const matchedCategory = allCategories.find(
          c => c.name.toLowerCase() === voicePrefill.category.toLowerCase()
        )
        setValue('categoryId', matchedCategory?.id || allCategories[0].id)
      } else {
        setValue('categoryId', allCategories[0].id)
      }
    }
  }, [isOpen, allCategories, selectedCategoryId, setValue, editTransaction, voicePrefill])

  // Reset category if user changes toggle to a type that doesn't contain current category
  useEffect(() => {
    if (isOpen && allCategories.length > 0) {
      const exists = allCategories.some(c => c.id === selectedCategoryId)
      if (!exists) {
        setValue('categoryId', allCategories[0].id)
      }
    }
  }, [transactionType, allCategories, selectedCategoryId, setValue, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (watchedDate === todayStr) setDatePreset('today')
    else if (watchedDate === yesterdayStr) setDatePreset('yesterday')
    else setDatePreset('custom')
  }, [watchedDate, isOpen, todayStr, yesterdayStr])

  const filteredGroups = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return grouped
    return grouped
      .map(g => ({
        group: g.group,
        categories: g.categories.filter(c => c.name.toLowerCase().includes(q)),
      }))
      .filter(g => g.categories.length > 0)
  }, [grouped, categoryQuery])

  const filteredUngrouped = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return ungrouped
    return ungrouped.filter(c => c.name.toLowerCase().includes(q))
  }, [ungrouped, categoryQuery])

  const parsedAmount = parseFloat(watchedAmount)
  const showPreview = typeof currentBalance === 'number' && !isNaN(parsedAmount) && parsedAmount > 0
  const previewBalance = showPreview
    ? transactionType === 'expense'
      ? (currentBalance as number) - parsedAmount
      : (currentBalance as number) + parsedAmount
    : null

  const addMutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      if (!store) return
      const category = allCategories.find(c => c.id === data.categoryId)
      const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
      const categoryIdToSend = data.categoryId && isUuid(data.categoryId) ? data.categoryId : null

      return store.addTransaction({
        amount: parseFloat(data.amount),
        type: transactionType,
        category: category?.name || 'Other',
        categoryId: categoryIdToSend,
        note: data.note || null,
        date: data.date,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      reset()
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  const editMutation = useMutation({
    mutationFn: async (data: ExpenseForm & { id: string }) => {
      if (!store) return
      const category = allCategories.find(c => c.id === data.categoryId)
      const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
      const categoryIdToSend = data.categoryId && isUuid(data.categoryId) ? data.categoryId : null

      return store.updateTransaction(data.id, {
        amount: parseFloat(data.amount),
        type: transactionType,
        category: category?.name || 'Other',
        categoryId: categoryIdToSend,
        note: data.note || null,
        date: data.date,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      reset()
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  const onSubmit = (data: ExpenseForm) => {
    setError('')
    if (editTransaction) {
      editMutation.mutate({ ...data, id: editTransaction.id })
    } else {
      addMutation.mutate(data)
    }
  }

  const selectDatePreset = (preset: 'today' | 'yesterday') => {
    setDatePreset(preset)
    setValue('date', preset === 'today' ? todayStr : yesterdayStr, { shouldDirty: true })
  }

  if (!isOpen) return null

  const isExpense = transactionType === 'expense'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-heading"
      aria-describedby="expense-modal-subtitle"
    >
      <div className="absolute inset-0 bg-primary/20 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div ref={modalRef} className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-md animate-scale-in max-h-[88vh] flex flex-col border border-white/20 dark:border-white/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-4">
          <h2 id="expense-modal-heading" className="text-xl font-bold text-primary dark:text-[#E8ECE4] font-display">
            {editTransaction
              ? (isExpense ? 'Edit Expense' : 'Edit Income')
              : (isExpense ? 'Add Expense' : 'Add Income')}
          </h2>
          <p id="expense-modal-subtitle" className="text-xs text-secondary dark:text-secondary/70 mt-1 font-sans">
            {editTransaction ? 'Update the details below' : voicePrefill ? 'Confirm the voice entry below' : `Fill in the details to add ${isExpense ? 'an expense' : 'an income'}`}
          </p>

          <div className="flex bg-[#EEF1EB] dark:bg-white/5 p-1 rounded-full mt-4" role="tablist" aria-label="Transaction type">
            <button
              type="button"
              role="tab"
              aria-selected={isExpense}
              onClick={() => setTransactionType('expense')}
              className={`flex-1 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 ${
                isExpense
                  ? 'bg-accent-red text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isExpense}
              onClick={() => setTransactionType('income')}
              className={`flex-1 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 ${
                !isExpense
                  ? 'bg-accent-green text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary dark:text-secondary/70 font-semibold text-2xl">₹</span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...amountRegister}
                ref={(e) => {
                  amountRef(e)
                  firstFocusableRef.current = e
                }}
                className="input-field pl-10 font-display text-4xl font-bold tabular-nums"
                placeholder="0.00"
                aria-label={`${isExpense ? 'Expense' : 'Income'} amount`}
                aria-required="true"
                aria-invalid={!!errors.amount}
              />
            </div>
            {errors.amount && <p className="text-sm text-accent-red mt-1" role="alert">{errors.amount.message}</p>}
            {showPreview && previewBalance !== null && (
              <p className="mt-2 text-sm text-secondary dark:text-secondary/70 tabular-nums" aria-live="polite">
                Remaining after: <span className={`font-bold ${previewBalance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>₹{Math.abs(previewBalance).toFixed(2)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Category</label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-secondary dark:text-secondary/70 text-sm" role="status">
                <div className="w-5 h-5 border-2 border-accent-green border-t-transparent rounded-full animate-spin mr-2" />
                Loading categories...
              </div>
            ) : allCategories.length === 0 ? (
              <div className="text-center py-8 text-secondary dark:text-secondary/70 text-sm">
                <p className="mb-2">No categories found.</p>
                <p>Click <span className="font-semibold">Categories</span> in the header to create one.</p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50 pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    value={categoryQuery}
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    className="input-field pl-9 text-sm"
                    placeholder="Search categories"
                    aria-label="Search categories"
                  />
                </div>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1" role="radiogroup" aria-label="Select category">
                  {filteredGroups.map((groupItem) => (
                    <div key={groupItem.group?.id || 'ungrouped-section'}>
                      {groupItem.group && (
                        <div className="text-xs font-bold text-secondary/60 dark:text-secondary/40 uppercase tracking-wider mb-1 px-1">
                          {groupItem.group.name}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {groupItem.categories.map((cat) => {
                          const selected = selectedCategoryId === cat.id
                          return (
                            <label
                              key={cat.id}
                              className={`flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-2xl cursor-pointer transition-all duration-200 border-2 select-none active:scale-[0.98] ${
                                selected
                                  ? 'border-accent-green bg-accent-green/[0.04]'
                                  : 'border-transparent hover:bg-[#F9FAF8] dark:hover:bg-white/5'
                              }`}
                            >
                              <span className="text-xl w-8 h-8 flex items-center justify-center rounded-xl bg-primary/[0.04] dark:bg-white/[0.04] flex-shrink-0">
                                {cat.icon || '📦'}
                              </span>
                              <span className={`text-sm font-semibold flex-1 ${selected ? 'text-accent-green' : 'text-primary dark:text-[#E8ECE4]'}`}>{cat.name}</span>
                              {selected && <span className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" aria-hidden="true" />}
                              <input
                                type="radio"
                                {...register('categoryId')}
                                value={cat.id}
                                className="sr-only"
                                aria-label={cat.name}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {filteredUngrouped.length > 0 && (
                    <div>
                      {filteredGroups.length > 0 && (
                        <div className="text-xs font-bold text-secondary/60 dark:text-secondary/40 uppercase tracking-wider mb-1 px-1">Other</div>
                      )}
                      <div className="space-y-1.5">
                        {filteredUngrouped.map((cat) => {
                          const selected = selectedCategoryId === cat.id
                          return (
                            <label
                              key={cat.id}
                              className={`flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-2xl cursor-pointer transition-all duration-200 border-2 select-none active:scale-[0.98] ${
                                selected
                                  ? 'border-accent-green bg-accent-green/[0.04]'
                                  : 'border-transparent hover:bg-[#F9FAF8] dark:hover:bg-white/5'
                              }`}
                            >
                              <span className="text-xl w-8 h-8 flex items-center justify-center rounded-xl bg-primary/[0.04] dark:bg-white/[0.04] flex-shrink-0">
                                {cat.icon || '📦'}
                              </span>
                              <span className={`text-sm font-semibold flex-1 ${selected ? 'text-accent-green' : 'text-primary dark:text-[#E8ECE4]'}`}>{cat.name}</span>
                              {selected && <span className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" aria-hidden="true" />}
                              <input
                                type="radio"
                                {...register('categoryId')}
                                value={cat.id}
                                className="sr-only"
                                aria-label={cat.name}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {filteredGroups.length === 0 && filteredUngrouped.length === 0 && (
                    <p className="text-sm text-secondary text-center py-4">No categories match “{categoryQuery}”.</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Date</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => selectDatePreset('today')}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-all ${datePreset === 'today' ? 'bg-accent-green text-white shadow-sm' : 'bg-[#EEF1EB] dark:bg-white/5 text-secondary hover:text-primary'}`}
                aria-pressed={datePreset === 'today'}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => selectDatePreset('yesterday')}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-all ${datePreset === 'yesterday' ? 'bg-accent-green text-white shadow-sm' : 'bg-[#EEF1EB] dark:bg-white/5 text-secondary hover:text-primary'}`}
                aria-pressed={datePreset === 'yesterday'}
              >
                Yesterday
              </button>
            </div>
            <input
              type="date"
              {...register('date', { required: true })}
              className="input-field font-sans text-sm"
              aria-label={`${isExpense ? 'Expense' : 'Income'} date`}
              aria-required="true"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
              Note <span className="text-secondary/50 font-normal lowercase italic">(optional)</span>
            </label>
            <input
              type="text"
              {...register('note')}
              className="input-field text-sm"
              placeholder={isExpense ? 'What did you buy?' : 'Where did this income come from?'}
              aria-label="Optional note"
            />
          </div>

          {error && (
            <div className="p-3 bg-accent-red/10 text-accent-red rounded-xl text-sm font-semibold" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 min-h-[44px]"
              aria-label="Cancel and close"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 min-h-[44px]"
              aria-label={editTransaction ? 'Save changes' : (isExpense ? 'Add Expense' : 'Add Income')}
            >
              {editTransaction ? 'Save Changes' : (isExpense ? 'Add Expense' : 'Add Income')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
