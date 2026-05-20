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
          bg: 'bg-surface hover:border-accent-green/20',
          icon: 'bg-accent-green/10 text-accent-green',
          text: 'text-primary',
        }
      case 'expense':
        return {
          bg: 'bg-surface hover:border-accent-red/20',
          icon: 'bg-accent-red/10 text-accent-red',
          text: 'text-primary',
        }
      case 'balance':
        return {
          bg: isPositive 
            ? 'bg-accent-green/[0.03] border-accent-green/20 hover:border-accent-green/40 shadow-sm' 
            : 'bg-accent-red/[0.03] border-accent-red/20 hover:border-accent-red/40 shadow-sm',
          icon: isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red',
          text: isPositive ? 'text-accent-green' : 'text-accent-red',
        }
    }
  }

  const styles = getVariantStyles()

  const getIcon = () => {
    if (variant === 'income') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      )
    }
    if (variant === 'expense') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const formattedAmount = `${amount < 0 ? '-' : ''}₹${Math.abs(amount).toFixed(2)}`

  return (
    <div 
      className={`card p-5 hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 ease-out select-none ${styles.bg}`} 
      role="region" 
      aria-label={`${title} — ${formattedAmount}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary/80 font-sans">{title}</span>
        <div className={`p-2 rounded-xl transition-colors duration-300 ${styles.icon}`} aria-hidden="true">
          {getIcon()}
        </div>
      </div>
      <p className={`text-2xl font-bold font-display mt-4 tracking-tight leading-none ${styles.text}`} aria-label={formattedAmount}>
        {formattedAmount}
      </p>
    </div>
  )
}