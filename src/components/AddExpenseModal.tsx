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
  voicePrefill?: { amount: number; category: string; note: string } | null
}

interface ExpenseForm {
  amount: string
  categoryId: string
  note: string
  date: string
}

export function AddExpenseModal({ isOpen, onClose, editTransaction, voicePrefill }: AddExpenseModalProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { grouped, ungrouped, allCategories, isLoading } = useCategoryPickerData(user?.id)

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

  useEffect(() => {
    if (isOpen && allCategories.length > 0 && !selectedCategoryId) {
      setValue('categoryId', allCategories[0].id)
    }
  }, [isOpen, allCategories, selectedCategoryId, setValue])

  useEffect(() => {
    if (editTransaction) {
      reset({
        amount: editTransaction.amount.toString(),
        categoryId: editTransaction.category_id || allCategories.find(c => c.name === editTransaction.category)?.id || '',
        note: editTransaction.note || '',
        date: editTransaction.date,
      })
    } else if (voicePrefill) {
      const matchedCategory = allCategories.find(
        c => c.name.toLowerCase() === voicePrefill.category.toLowerCase()
      )
      reset({
        amount: voicePrefill.amount > 0 ? voicePrefill.amount.toString() : '',
        categoryId: matchedCategory?.id || allCategories[0]?.id || '',
        note: voicePrefill.note,
        date: format(new Date(), 'yyyy-MM-dd'),
      })
    } else if (allCategories.length > 0) {
      reset({
        amount: '',
        categoryId: allCategories[0].id,
        note: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
    }
  }, [editTransaction, voicePrefill, reset, isOpen, allCategories])

  const addMutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      if (!user) return
      const category = allCategories.find(c => c.id === data.categoryId)
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: parseFloat(data.amount),
        category: category?.name || 'Other',
        category_id: data.categoryId,
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
      const category = allCategories.find(c => c.id === data.categoryId)
      await supabase
        .from('transactions')
        .update({
          amount: parseFloat(data.amount),
          category: category?.name || 'Other',
          category_id: data.categoryId,
          note: data.note || null,
          date: data.date,
        })
        .eq('id', data.id)
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
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div ref={modalRef} className="relative bg-surface rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="expense-modal-heading" className="text-xl font-bold text-primary font-display">
            {editTransaction ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <p id="expense-modal-subtitle" className="text-xs text-secondary mt-1 font-sans">
            {editTransaction ? 'Update the details below' : 'Fill in the details to add an expense'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Amount</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: '0.01' })}
                className="input-field pl-9 font-display text-xl font-bold"
                placeholder="0.00"
                ref={(e) => {
                  const { ref } = register('amount', { required: 'Amount is required', min: '0.01' })
                  ref(e)
                  firstFocusableRef.current = e
                }}
                aria-label="Expense amount"
                aria-required="true"
                aria-invalid={!!errors.amount}
              />
            </div>
            {errors.amount && <p className="text-sm text-accent-red mt-1" role="alert">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Category</label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-secondary text-sm" role="status">
                <div className="w-5 h-5 border-2 border-accent-green border-t-transparent rounded-full animate-spin mr-2" />
                Loading categories...
              </div>
            ) : allCategories.length === 0 ? (
              <div className="text-center py-8 text-secondary text-sm">
                <p className="mb-2">No categories found.</p>
                <p>Click <span className="font-semibold">Categories</span> in the header to create one.</p>
              </div>
            ) : (
              <div className="space-y-2" role="radiogroup" aria-label="Select category">
                {grouped.map((groupItem) => (
                  <div key={groupItem.group?.id || 'ungrouped-section'}>
                    {groupItem.group && (
                      <div className="text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1 px-1">
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
                              : 'border-transparent hover:bg-[#F9FAF8] hover:border-[#E8ECE4]'
                          }`}
                        >
                          <span className="text-lg transition-transform duration-300">
                            {cat.icon || '📦'}
                          </span>
                          <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 text-center leading-tight ${
                            selectedCategoryId === cat.id ? 'text-accent-green' : 'text-secondary'
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
                      <div className="text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1 px-1">Other</div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {ungrouped.map((cat) => (
                        <label
                          key={cat.id}
                          className={`group flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none active:scale-[0.96] ${
                            selectedCategoryId === cat.id
                              ? 'border-accent-green bg-accent-green/[0.04] shadow-[0_4px_12px_rgba(45,106,79,0.06)]'
                              : 'border-transparent hover:bg-[#F9FAF8] hover:border-[#E8ECE4]'
                          }`}
                        >
                          <span className="text-lg transition-transform duration-300">
                            {cat.icon || '📦'}
                          </span>
                          <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 text-center leading-tight ${
                            selectedCategoryId === cat.id ? 'text-accent-green' : 'text-secondary'
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
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Date</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="input-field font-sans text-sm"
              aria-label="Expense date"
              aria-required="true"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
              Note <span className="text-secondary/50 font-normal font-sans lowercase italic">(optional)</span>
            </label>
            <input
              type="text"
              {...register('note')}
              className="input-field text-sm"
              placeholder="What did you buy?"
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
              aria-label={editTransaction ? 'Save changes' : 'Add expense'}
            >
              {editTransaction ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}