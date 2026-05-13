interface BalanceCardProps {
  title: string
  amount: number
  variant: 'income' | 'expense' | 'balance'
}

export function BalanceCard({ title, amount, variant }: BalanceCardProps) {
  const isPositive = amount >= 0
  const isBalance = variant === 'balance'

  const getStyles = () => {
    if (!isBalance) return 'bg-white'
    if (isPositive) return 'bg-green-50'
    return 'bg-red-50'
  }

  const getTextStyles = () => {
    if (!isBalance) return 'text-gray-900'
    if (isPositive) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <div className={`rounded-xl p-4 shadow-sm ${getStyles()}`}>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${getTextStyles()}`}>
        ${Math.abs(amount).toFixed(2)}
      </p>
    </div>
  )
}