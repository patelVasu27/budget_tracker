interface BalanceCardProps {
  title: string
  amount: number
  variant: 'income' | 'expense' | 'balance'
}

export function BalanceCard({ title, amount, variant }: BalanceCardProps) {
  const isPositive = amount >= 0

  const getVariantStyles = () => {
    switch (variant) {
      case 'income':
        return {
          bg: 'bg-primary/[0.03]',
          icon: 'bg-accent-green/10',
          text: 'text-primary',
          iconBg: 'text-accent-green',
        }
      case 'expense':
        return {
          bg: 'bg-primary/[0.03]',
          icon: 'bg-accent-red/10',
          text: 'text-primary',
          iconBg: 'text-accent-red',
        }
      case 'balance':
        return {
          bg: isPositive ? 'bg-accent-green/[0.05]' : 'bg-accent-red/[0.05]',
          icon: isPositive ? 'bg-accent-green/10' : 'bg-accent-red/10',
          text: isPositive ? 'text-accent-green' : 'text-accent-red',
          iconBg: isPositive ? 'text-accent-green' : 'text-accent-red',
        }
    }
  }

  const styles = getVariantStyles()

  const getIcon = () => {
    if (variant === 'income') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      )
    }
    if (variant === 'expense') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const formattedAmount = `₹${Math.abs(amount).toFixed(2)}`

  return (
    <div className={`card p-4 ${styles.bg}`} role="region" aria-label={`${title} — ${formattedAmount}`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${styles.icon}`}>
          <span className={styles.iconBg}>{getIcon()}</span>
        </div>
      </div>
      <p className="text-xs text-secondary mt-3 font-medium">{title}</p>
       <p className={`text-xl font-semibold mt-1 ${styles.text}`} aria-label={formattedAmount}>
         {formattedAmount}
       </p>
    </div>
  )
}