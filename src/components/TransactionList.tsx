import { useState, useRef, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, Check } from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'
import { Tooltip } from './Tooltip'
import type { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  categoryMeta?: Record<string, { color?: string | null; icon?: string | null }>
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
  groupByDate?: boolean
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

function getDateKey(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  return format(date, 'yyyy-MM-dd')
}

function getDateLabel(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return 'Today'
  }
  if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return 'Yesterday'
  }
  return format(date, 'EEEE, MMMM d, yyyy')
}

export function TransactionList({ transactions, categoryMeta, onEdit, onDelete, groupByDate = true }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
    }
  }, [])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!groupByDate) {
      return [{ dateKey: '', dateLabel: '', transactions }]
    }

    const groups = new Map<string, { dateLabel: string; transactions: Transaction[] }>()

    transactions.forEach(tx => {
      const dateKey = getDateKey(tx.date)
      const dateLabel = getDateLabel(tx.date)
      if (!groups.has(dateKey)) {
        groups.set(dateKey, { dateLabel, transactions: [] })
      }
      groups.get(dateKey)!.transactions.push(tx)
    })

    // Sort groups by date descending
    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, { dateLabel, transactions }]) => ({ dateKey, dateLabel, transactions }))
  }, [transactions, groupByDate])

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16" role="status" aria-label="No transactions yet">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/[0.03] dark:bg-white/[0.03] rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-secondary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-lg font-medium text-primary dark:text-[#E8ECE4]">No transactions yet</p>
        <p className="text-sm text-secondary mt-1">Tap the mic or + button to log an income or expense</p>
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
    <div className="space-y-4" role="list" aria-label="Transaction list">
      {groupedTransactions.map(({ dateKey, dateLabel, transactions: groupTxs }) => (
        <div key={dateKey} className="space-y-1.5 animate-slide-in">
          {dateLabel && (
            <div className="sticky top-0 z-10 mb-2 animate-fade-in" style={{ animationDelay: '60ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background dark:bg-[#0F1410] border border-border-subtle dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 backdrop-blur-sm shadow-sm">
                {dateLabel}
              </div>
            </div>
          )}
          {groupTxs.map((tx, index) => {
            const meta = categoryMeta?.[tx.category_id || ''] ?? categoryMeta?.[tx.category.toLowerCase()]
            return (
            <div
              key={tx.id}
              className="group transaction-row min-h-[64px] animate-stagger-in"
              style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
              role="listitem"
            >
              <CategoryIcon category={tx.category} color={meta?.color} icon={meta?.icon} size="lg" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary dark:text-[#E8ECE4] text-sm leading-snug">{tx.category}</p>
                <p className="text-xs text-secondary mt-0.5 truncate font-sans">
                  {format(parseLocalDate(tx.date), 'MMM d, yyyy')}
                  {tx.note && <span className="text-secondary/60"> · {tx.note}</span>}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-bold font-display text-base sm:text-lg tabular-nums ${tx.type === 'income' ? 'text-accent-green' : 'text-accent-red'}`}
                  aria-label={`${tx.type === 'income' ? 'Income' : 'Expense'} ₹${tx.amount.toFixed(2)}`}
                >
                  ₹{tx.amount.toFixed(2)}
                </span>

                {onEdit && (
                  <Tooltip content="Edit Transaction">
                    <button
                      onClick={() => onEdit(tx)}
                      className="action-button action-button-hidden text-secondary/40 hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5"
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
                      className={`action-button transition-all duration-200 focus:opacity-100 ${
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
            )
          })}
        </div>
      ))}
    </div>
  )
}