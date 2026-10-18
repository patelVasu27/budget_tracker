import { useEffect, useState } from 'react'

interface BalanceCardProps {
  title: string
  amount: number
  variant: 'income' | 'expense' | 'balance'
}

export function BalanceCard({ title, amount, variant }: BalanceCardProps) {
  const isPositive = amount >= 0
  const [displayAmount, setDisplayAmount] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  // Count-up animation for the balance card
  useEffect(() => {
    setIsMounted(true)
    if (variant === 'balance') {
      const duration = 800
      const startTime = Date.now()
      const startValue = 0
      const endValue = amount

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Easing: cubic-bezier(0.16, 1, 0.3, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayAmount(startValue + (endValue - startValue) * eased)
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    } else {
      setDisplayAmount(amount)
    }
  }, [amount, variant])

  const getVariantStyles = () => {
    switch (variant) {
      case 'income':
        return {
          bg: 'bg-white/70 dark:bg-[#1B2A1E]/60 border-transparent hover:border-accent-green/20',
          icon: 'bg-accent-green/10 text-accent-green',
          text: 'text-primary dark:text-[#E8ECE4]',
          accent: 'text-accent-green',
        }
      case 'expense':
        return {
          bg: 'bg-white/70 dark:bg-[#1B2A1E]/60 border-transparent hover:border-accent-red/20',
          icon: 'bg-accent-red/10 text-accent-red',
          text: 'text-primary dark:text-[#E8ECE4]',
          accent: 'text-accent-red',
        }
      case 'balance':
        return {
          bg: isPositive
            ? 'bg-accent-green/[0.05] dark:bg-accent-green/[0.08] border-accent-green/20 hover:border-accent-green/40 shadow-sm'
            : 'bg-accent-red/[0.05] dark:bg-accent-red/[0.08] border-accent-red/20 hover:border-accent-red/40 shadow-sm',
          icon: isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red',
          text: isPositive ? 'text-accent-green' : 'text-accent-red',
          accent: isPositive ? 'text-accent-green' : 'text-accent-red',
        }
    }
  }

  const styles = getVariantStyles()

  const getIcon = () => {
    if (variant === 'income') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      )
    }
    if (variant === 'expense') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const formattedAmount = `${amount < 0 ? '−' : ''}₹${Math.abs(amount).toFixed(2)}`
  const displayFormatted = `${displayAmount < 0 ? '−' : ''}₹${Math.abs(displayAmount).toFixed(2)}`

  return (
    <div
      className={`card p-5 hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 ease-out select-none ${styles.bg}`}
      role="region"
      aria-label={`${title} — ${formattedAmount}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary/80 font-sans">{title}</span>
        <div className={`p-2.5 rounded-xl transition-colors duration-300 ${styles.icon}`} aria-hidden="true">
          {getIcon()}
        </div>
      </div>
      <p
        className={`mt-4 font-bold font-display leading-none tabular-nums ${styles.text} ${variant === 'balance' ? 'text-balance-xl' : 'text-2xl sm:text-3xl'}`}
        aria-label={formattedAmount}
      >
        {variant === 'balance' && isMounted ? displayFormatted : formattedAmount}
      </p>
    </div>
  )
}