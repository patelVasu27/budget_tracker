import { useState } from 'react'
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
}

interface ExpenseForm {
  amount: string
  category: Category
  note: string
  date: string
}

export function AddExpenseModal({ isOpen, onClose, editTransaction }: AddExpenseModalProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseForm>({
    defaultValues: {
      amount: editTransaction?.amount.toString() || '',
      category: editTransaction?.category as Category || 'Food',
      note: editTransaction?.note || '',
      date: editTransaction?.date || format(new Date(), 'yyyy-MM-dd'),
    }
  })

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {editTransaction ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { required: 'Amount is required', min: '0.01' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0.00"
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              {...register('category', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Note (optional)</label>
            <input
              type="text"
              {...register('note')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Add a note..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editTransaction ? 'Save' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}