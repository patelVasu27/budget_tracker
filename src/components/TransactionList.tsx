import { format } from 'date-fns'
import type { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No expenses yet</p>
        <p className="text-sm mt-1">Click "Add Expense" to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
        >
          <div>
            <p className="font-medium text-gray-900">{tx.category}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(tx.date), 'MMM d, yyyy')}
              {tx.note && ` • ${tx.note}`}
            </p>
          </div>
          <p className="font-semibold text-red-600">
            -${tx.amount.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  )
}