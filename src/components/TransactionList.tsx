import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, Check } from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'
import { Tooltip } from './Tooltip'
import type { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}


export function parseLocalDate(dateStr: string): Date {
  if (dateStr && typeof dateStr === 'string') {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month, day)
        if (!isNaN(d.getTime())) {
          return d
        }
      }
    }
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date() : d
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
      <div className="text-center py-16" role="status" aria-label="No transactions yet">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/[0.03] dark:bg-white/[0.03] rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-secondary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-lg font-medium text-primary dark:text-[#E8ECE4]">No transactions yet</p>
        <p className="text-sm text-secondary mt-1">Tap the plus button to log an income or expense</p>
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
    <div className="space-y-1.5" role="list" aria-label="Transaction list">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="group flex items-center gap-4 p-3 sm:p-3.5 rounded-2xl hover:bg-[#F9FAF8] dark:hover:bg-white/[0.02] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(27,42,30,0.02)] transition-all duration-300 ease-out border border-transparent hover:border-[#E8ECE4] dark:hover:border-white/5"
          role="listitem"
        >
          <CategoryIcon category={tx.category} />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-primary dark:text-[#E8ECE4] text-sm leading-snug">{tx.category}</p>
            <p className="text-xs text-secondary mt-0.5 truncate font-sans">
              {format(parseLocalDate(tx.date), 'MMM d, yyyy')}
              {tx.note && <span className="text-secondary/60"> · {tx.note}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
             <span
               className={`font-bold font-display text-base sm:text-lg tabular-nums ${
                 tx.type === 'income' ? 'text-accent-green' : 'text-accent-red'
               }`}
               aria-label={`${tx.type === 'income' ? 'Plus' : 'Minus'} ₹${tx.amount.toFixed(2)}`}
             >
               {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
             </span>

            {onEdit && (
              <Tooltip content="Edit Transaction">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-2 text-secondary/40 hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                  aria-label={`Edit ${tx.category} ${tx.type === 'income' ? 'income' : 'expense'}`}
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip content={deletingId === tx.id ? "Confirm Delete" : "Delete Transaction"}>
                <button
                  onClick={() => handleDeleteClick(tx)}
                  className={`p-2 rounded-lg transition-all duration-200 focus:opacity-100 ${
                    deletingId === tx.id
                      ? 'bg-accent-red text-white shadow-sm hover:bg-[#C24E2E] animate-scale-in opacity-100'
                      : 'text-secondary/40 hover:text-accent-red hover:bg-accent-red/5 opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label={deletingId === tx.id ? `Confirm delete ${tx.category} ${tx.type === 'income' ? 'income' : 'expense'}` : `Delete ${tx.category} ${tx.type === 'income' ? 'income' : 'expense'}`}
                  aria-pressed={deletingId === tx.id}
                >
                  {deletingId === tx.id ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
