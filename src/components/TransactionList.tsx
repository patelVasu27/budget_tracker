import { useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No expenses yet</p>
        <p className="text-sm mt-1">Click "Add Expense" to get started</p>
      </div>
    )
  }

  const handleDeleteClick = (tx: Transaction) => {
    if (deletingId === tx.id) {
      onDelete?.(tx)
      setDeletingId(null)
    } else {
      setDeletingId(tx.id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
        >
          <div className="flex-1">
            <p className="font-medium text-gray-900">{tx.category}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(tx.date), 'MMM d, yyyy')}
              {tx.note && ` • ${tx.note}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-semibold text-red-600">
              -${tx.amount.toFixed(2)}
            </p>
            {onEdit && (
              <button
                onClick={() => onEdit(tx)}
                className="p-1.5 text-gray-400 hover:text-blue-600"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => handleDeleteClick(tx)}
                className={`p-1.5 ${deletingId === tx.id ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                title={deletingId === tx.id ? 'Click again to confirm' : 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}