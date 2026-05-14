import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, Check } from 'lucide-react'
import type { Transaction, Category } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
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

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
    }
  }, [])

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16" role="status" aria-label="No expenses yet">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/[0.03] rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-secondary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-lg font-medium text-primary">No expenses yet</p>
        <p className="text-sm text-secondary mt-1">Click &quot;Add Expense&quot; to get started</p>
      </div>
    )
  }

  const handleDeleteClick = (tx: Transaction) => {
    if (deletingId === tx.id) {
      onDelete?.(tx)
      setDeletingId(null)
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
        deleteTimerRef.current = null
      }
    } else {
      setDeletingId(tx.id)
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = setTimeout(() => setDeletingId(null), 4000)
    }
  }

  return (
    <div className="space-y-2" role="list" aria-label="Transaction list">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="group flex items-center gap-4 p-3 rounded-xl hover:bg-primary/[0.02] transition-colors duration-150"
          role="listitem"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-primary/[0.03] rounded-xl flex items-center justify-center text-lg" aria-hidden="true">
            {CATEGORY_ICONS[tx.category as Category] || '📦'}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary truncate">{tx.category}</p>
            <p className="text-sm text-secondary truncate">
              {format(new Date(tx.date), 'MMM d, yyyy')}
              {tx.note && ` · ${tx.note}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
             <span className="font-semibold text-accent-red tabular-nums" aria-label={`Minus ₹${tx.amount.toFixed(2)}`}>
                -₹{tx.amount.toFixed(2)}
             </span>
            
            {onEdit && (
              <button
                onClick={() => onEdit(tx)}
                className="p-2 text-secondary/40 hover:text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                aria-label={`Edit ${tx.category} expense`}
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => handleDeleteClick(tx)}
                className={`p-2 rounded-lg transition-all ${
                  deletingId === tx.id
                    ? 'bg-accent-red text-white'
                    : 'text-secondary/40 hover:text-accent-red hover:bg-accent-red/5 opacity-0 group-hover:opacity-100'
                }`}
                aria-label={deletingId === tx.id ? `Confirm delete ${tx.category} expense` : `Delete ${tx.category} expense`}
                aria-pressed={deletingId === tx.id}
              >
                {deletingId === tx.id ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}