import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useCategoryPickerData } from '../hooks/useCategories'
import type { Transaction } from '../types'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  editTransaction?: Transaction | null
  voicePrefill?: { amount: number; category: string; note: string; type?: 'expense' | 'income' } | null
}

interface ExpenseForm {
  amount: string
  categoryId: string
  note: string
  date: string
}

export function AddExpenseModal({ isOpen, onClose, editTransaction, voicePrefill }: AddExpenseModalProps) {
  const { user, isGuest } = useAuthStore()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')

  const activeUserId = isGuest ? 'guest' : user?.id
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
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLInputElement | null>(null)

  const { ref: amountRef, ...amountRegister } = register('amount', { 
    required: 'Amount is required', 
    min: { value: 0.01, message: 'Amount must be greater than 0' } 
  })

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

    if (editTransaction) {
      setTransactionType(editTransaction.type || 'expense')
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
  }, [isOpen, editTransaction, voicePrefill, reset])

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

  const addMutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      const category = allCategories.find(c => c.id === data.categoryId)
      if (isGuest) {
        const local = localStorage.getItem('guest_transactions')
        let transactions: Transaction[] = []
        if (local) {
          try {
            transactions = JSON.parse(local)
            if (!Array.isArray(transactions)) {
              transactions = []
            }
          } catch (e) {
            console.error('Failed to parse guest_transactions in addMutation:', e)
          }
        }
        const newTx: Transaction = {
          id: 'tx-' + Math.random().toString(36).substr(2, 9),
          user_id: 'guest',
          amount: parseFloat(data.amount),
          type: transactionType,
          category: category?.name || 'Other',
          category_id: data.categoryId,
          note: data.note || null,
          date: data.date,
          created_at: new Date().toISOString()
        }
        transactions.push(newTx)
        localStorage.setItem('guest_transactions', JSON.stringify(transactions))
        return newTx
      }
      if (!user) return

      const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
      const categoryIdToSend = data.categoryId && isUuid(data.categoryId) ? data.categoryId : null

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: parseFloat(data.amount),
        type: transactionType,
        category: category?.name || 'Other',
        category_id: categoryIdToSend,
        note: data.note || null,
        date: data.date,
      })
      if (error) throw error
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
      const category = allCategories.find(c => c.id === data.categoryId)
      if (isGuest) {
        const local = localStorage.getItem('guest_transactions')
        let transactions: Transaction[] = []
        if (local) {
          try {
            transactions = JSON.parse(local)
            if (!Array.isArray(transactions)) {
              transactions = []
            }
          } catch (e) {
            console.error('Failed to parse guest_transactions in editMutation:', e)
          }
        }
        const updated = transactions.map(tx => tx.id === data.id ? {
          ...tx,
          amount: parseFloat(data.amount),
          type: transactionType,
          category: category?.name || 'Other',
          category_id: data.categoryId,
          note: data.note || null,
          date: data.date
        } : tx)
        localStorage.setItem('guest_transactions', JSON.stringify(updated))
        return
      }

      const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
      const categoryIdToSend = data.categoryId && isUuid(data.categoryId) ? data.categoryId : null

      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(data.amount),
          type: transactionType,
          category: category?.name || 'Other',
          category_id: categoryIdToSend,
          note: data.note || null,
          date: data.date,
        })
        .eq('id', data.id)
      if (error) throw error
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-heading"
      aria-describedby="expense-modal-subtitle"
    >
      <div className="absolute inset-0 bg-primary/20 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div ref={modalRef} className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto border border-white/20 dark:border-white/5">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="expense-modal-heading" className="text-xl font-bold text-primary dark:text-[#E8ECE4] font-display">
            {editTransaction
              ? (transactionType === 'income' ? 'Edit Income' : 'Edit Expense')
              : (transactionType === 'income' ? 'Add Income' : 'Add Expense')}
          </h2>
          <p id="expense-modal-subtitle" className="text-xs text-secondary dark:text-secondary/70 mt-1 font-sans">
            {editTransaction ? 'Update the details below' : `Fill in the details to add ${transactionType === 'income' ? 'an income' : 'an expense'}`}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Transaction Type Toggle */}
          <div className="flex bg-[#EEF1EB] dark:bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTransactionType('expense')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                transactionType === 'expense'
                  ? 'bg-accent-red text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('income')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                transactionType === 'income'
                  ? 'bg-accent-green text-white shadow-sm'
                  : 'text-secondary dark:text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4]'
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Amount</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary dark:text-secondary/70 font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                {...amountRegister}
                ref={(e) => {
                  amountRef(e)
                  firstFocusableRef.current = e
                }}
                className="input-field pl-9 font-display text-xl font-bold"
                placeholder="0.00"
                aria-label={`${transactionType === 'income' ? 'Income' : 'Expense'} amount`}
                aria-required="true"
                aria-invalid={!!errors.amount}
              />
            </div>
            {errors.amount && <p className="text-sm text-accent-red mt-1" role="alert">{errors.amount.message}</p>}
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
              <div className="space-y-2" role="radiogroup" aria-label="Select category">
                {grouped.map((groupItem) => (
                  <div key={groupItem.group?.id || 'ungrouped-section'}>
                    {groupItem.group && (
                      <div className="text-xs font-bold text-secondary/60 dark:text-secondary/40 uppercase tracking-wider mb-1 px-1">
                        {groupItem.group.name}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {groupItem.categories.map((cat) => (
                        <label
                          key={cat.id}
                          className={`group flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none active:scale-[0.96] ${
                            selectedCategoryId === cat.id
                              ? 'border-accent-green bg-accent-green/[0.04] shadow-[0_4px_12px_rgba(45,106,79,0.06)]'
                              : 'border-transparent hover:bg-[#F9FAF8] dark:hover:bg-white/5 hover:border-[#E8ECE4] dark:hover:border-white/5'
                          }`}
                        >
                          <span className="text-lg transition-transform duration-300">
                            {cat.icon || '📦'}
                          </span>
                          <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 text-center leading-tight ${
                            selectedCategoryId === cat.id ? 'text-accent-green' : 'text-secondary dark:text-secondary/70'
                          }`}>{cat.name}</span>
                          <input
                            type="radio"
                            {...register('categoryId')}
                            value={cat.id}
                            className="sr-only"
                            aria-label={cat.name}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {ungrouped.length > 0 && (
                  <div>
                    {grouped.length > 0 && (
                      <div className="text-xs font-bold text-secondary/60 dark:text-secondary/40 uppercase tracking-wider mb-1 px-1">Other</div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {ungrouped.map((cat) => (
                        <label
                          key={cat.id}
                          className={`group flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none active:scale-[0.96] ${
                            selectedCategoryId === cat.id
                              ? 'border-accent-green bg-accent-green/[0.04] shadow-[0_4px_12px_rgba(45,106,79,0.06)]'
                              : 'border-transparent hover:bg-[#F9FAF8] dark:hover:bg-white/5 hover:border-[#E8ECE4] dark:hover:border-white/5'
                          }`}
                        >
                          <span className="text-lg transition-transform duration-300">
                            {cat.icon || '📦'}
                          </span>
                          <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 text-center leading-tight ${
                            selectedCategoryId === cat.id ? 'text-accent-green' : 'text-secondary dark:text-secondary/70'
                          }`}>{cat.name}</span>
                          <input
                            type="radio"
                            {...register('categoryId')}
                            value={cat.id}
                            className="sr-only"
                            aria-label={cat.name}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Date</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="input-field font-sans text-sm"
              aria-label={`${transactionType === 'income' ? 'Income' : 'Expense'} date`}
              aria-required="true"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
              Note <span className="text-secondary/50 font-normal font-sans lowercase italic">(optional)</span>
            </label>
            <input
              type="text"
              {...register('note')}
              className="input-field text-sm"
              placeholder={transactionType === 'income' ? 'Where did this income come from?' : 'What did you buy?'}
              aria-label="Optional note"
            />
          </div>

          {error && (
            <div className="p-3 bg-accent-red/10 text-accent-red rounded-xl text-sm font-semibold" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              aria-label="Cancel and close"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              aria-label={editTransaction ? 'Save changes' : (transactionType === 'income' ? 'Add Income' : 'Add Expense')}
            >
              {editTransaction ? 'Save Changes' : (transactionType === 'income' ? 'Add Income' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}