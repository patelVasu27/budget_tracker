import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { CATEGORIES, type Category, type Transaction } from '../types'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  editTransaction?: Transaction | null
  voicePrefill?: { amount: number; category: string; note: string } | null
}

interface ExpenseForm {
  amount: string
  category: Category
  note: string
  date: string
}

const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍽️',
  Transport: '🚗',
  Utilities: '💡',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Health: '💊',
  Other: '📦',
}

export function AddExpenseModal({ isOpen, onClose, editTransaction, voicePrefill }: AddExpenseModalProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ExpenseForm>({
    defaultValues: {
      amount: '',
      category: 'Food' as Category,
      note: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  })

  const selectedCategory = watch('category')
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLInputElement>(null)

  // Focus trap within modal when open
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
      // Focus first input on open
      setTimeout(() => firstFocusableRef.current?.focus(), 50)
      // Prevent background scroll
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    if (editTransaction) {
      reset({
        amount: editTransaction.amount.toString(),
        category: editTransaction.category as Category,
        note: editTransaction.note || '',
        date: editTransaction.date,
      })
    } else if (voicePrefill) {
      reset({
        amount: voicePrefill.amount > 0 ? voicePrefill.amount.toString() : '',
        category: voicePrefill.category as Category,
        note: voicePrefill.note,
        date: format(new Date(), 'yyyy-MM-dd'),
      })
    } else {
      reset({
        amount: '',
        category: 'Food',
        note: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
    }
  }, [editTransaction, voicePrefill, reset, isOpen])

  const addMutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      if (!user) return
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: parseFloat(data.amount),
        category: data.category,
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
      await supabase
        .from('transactions')
        .update({
          amount: parseFloat(data.amount),
          category: data.category,
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
      <div ref={modalRef} className="relative bg-surface rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="expense-modal-heading" className="text-xl font-semibold text-primary">
            {editTransaction ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <p id="expense-modal-subtitle" className="text-sm text-secondary mt-1">
            {editTransaction ? 'Update the details below' : 'Fill in the details to add an expense'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Amount</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">₹</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: '0.01' })}
                className="input-field pl-8"
                placeholder="0.00"
                ref={firstFocusableRef}
                aria-label="Expense amount"
                aria-required="true"
                aria-invalid={!!errors.amount}
              />
            </div>
            {errors.amount && <p className="text-sm text-accent-red mt-1" role="alert">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Select category">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer transition-all duration-150 border-2 ${
                    selectedCategory === cat
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:bg-primary/[0.03]'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs text-secondary">{cat}</span>
                  <input
                    type="radio"
                    {...register('category')}
                    value={cat}
                    className="sr-only"
                    aria-label={cat}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Date</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="input-field"
              aria-label="Expense date"
              aria-required="true"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Note <span className="text-secondary font-normal">(optional)</span>
            </label>
            <input
              type="text"
              {...register('note')}
              className="input-field"
              placeholder="Add a note..."
              aria-label="Optional note"
            />
          </div>

          {error && (
            <div className="p-3 bg-accent-red/10 text-accent-red rounded-lg text-sm" role="alert" aria-live="polite">
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