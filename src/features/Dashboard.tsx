import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Download, LogOut, Plus, Settings, Tags, Sun, Moon, User, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { VoiceMicButton } from '../components/VoiceMicButton'
import { parseAmount } from '../hooks/useAmountParser'
import { matchCategory } from '../lib/categoryMatcher'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { BalanceCard } from '../components/BalanceCard'
import { TransactionList } from '../components/TransactionList'
import { AddExpenseModal } from '../components/AddExpenseModal'
import { lazy, Suspense } from 'react'
const CategoryManager = lazy(() => import('./CategoryManager').then(m => ({ default: m.CategoryManager })))
const ExportModal = lazy(() => import('../components/ExportModal').then(m => ({ default: m.ExportModal })))
import { Tooltip } from '../components/Tooltip'
import { useCategories } from '../hooks/useCategories'
import { useDataStore } from '../stores/dataStore'
import type { Transaction, MonthlySettings } from '../types'

export function Dashboard() {
  const { user, clearSession, isGuest } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const queryClient = useQueryClient()
  const [income, setIncome] = useState(0)
  const [editingIncome, setEditingIncome] = useState(false)
  const [newIncome, setNewIncome] = useState('')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [voicePrefill, setVoicePrefill] = useState<{ amount: number; category: string; note: string; type?: 'expense' | 'income' } | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 1
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear

  const navigateMonth = (delta: number) => {
    let newMonth = selectedMonth + delta
    let newYear = selectedYear
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (newMonth < 1) { newMonth = 12; newYear-- }
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  const goToToday = () => {
    setSelectedMonth(currentMonth)
    setSelectedYear(currentYear)
  }

  const activeUserId = isGuest ? 'guest' : user?.id
  const store = useDataStore()
  const { data: allCategories = [] } = useCategories(activeUserId)
  const categoryMeta: Record<string, { color?: string | null; icon?: string | null }> = {}
  allCategories.forEach(c => {
    const meta = { color: c.color, icon: c.icon }
    categoryMeta[c.id] = meta
    categoryMeta[c.name.toLowerCase()] = meta
  })

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const { data: settings } = useQuery<MonthlySettings | null>({
    queryKey: ['monthlySettings', activeUserId, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!store) return null
      return store.getMonthlySettings(selectedMonth, selectedYear)
    },
    enabled: !!store,
  })

  const { data: transactions = [], isPending: isLoadingTransactions, error: transactionsError, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', activeUserId, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!store) return []
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const lastDay = new Date(selectedYear, selectedMonth, 0)
      const endDate = format(lastDay, 'yyyy-MM-dd')
      return store.listTransactions(startDate, endDate, isCurrentMonth, 200)
    },
    enabled: !!store,
  })

  const saveIncomeMutation = useMutation({
    mutationFn: async (newIncomeValue: number) => {
      if (!store) return
      return store.upsertMonthlyIncome(newIncomeValue, selectedMonth, selectedYear, settings ?? null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlySettings'] })
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!store) return
      return store.deleteTransaction(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

const handleVoiceResult = (transcript: string) => {
    setVoiceError(null)
    const amount = parseAmount(transcript)
    const { bestGuess } = matchCategory(transcript)
    
    // Robust note extraction: remove currency markers first, then digits, then cleanup punctuation
    const cleanNote = transcript
      .replace(/\b(?:rs\.?|rupees?|inr|usd|dollars?|cents?|₹|₨)\b/gi, '')
      .replace(/\d+(?:\.\d{1,2})?/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const isIncome = /\b(?:received|earned|income|salary|bonus|gift|freelance|sold|deposit|interest|dividend)\b/i.test(transcript)
    console.info('[Voice Parsing]', { amount, category: bestGuess, type: isIncome ? 'income' : 'expense' })
    setVoicePrefill({ 
      amount: amount || 0,
      category: bestGuess, 
      note: cleanNote || transcript.replace(/\d+(?:\.\d{1,2})?/g, '').trim(),
      type: isIncome ? 'income' : 'expense'
    })
    setShowExpenseModal(true)
    setRetryCount(0)
  }

  const handleVoiceError = (error: string) => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1)
      setVoiceError(`${error} — tap the mic to try again.`)
    } else {
      setVoiceError("Voice didn't work this time. Use the form below.")
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowExpenseModal(true)
  }

  const handleDeleteTransaction = (transaction: Transaction) => {
    deleteTransactionMutation.mutate(transaction.id)
  }

  useEffect(() => {
    if (settings?.income) {
      setIncome(settings.income)
    }
  }, [settings])

  // Use integer-cents arithmetic to avoid floating-point drift
  const toCents = (amount: number) => Math.round(amount * 100)
  const totalExpensesCents = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + toCents(tx.amount), 0)
  const totalIncomeTransactionsCents = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + toCents(tx.amount), 0)
  const totalIncomeCents = toCents(income) + totalIncomeTransactionsCents
  const totalExpenses = totalExpensesCents / 100
  const totalIncome = totalIncomeCents / 100
  const remainingBalance = (totalIncomeCents - totalExpensesCents) / 100

  const handleSaveIncome = () => {
    const value = parseFloat(newIncome)
    if (!isNaN(value) && value >= 0) {
      saveIncomeMutation.mutate(value)
      setIncome(value)
    }
    setEditingIncome(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearSession()
  }

  const handleUserMenuLogout = () => {
    setShowUserMenu(false)
    handleLogout()
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0F1410] transition-colors duration-300">
      <header className="glass-nav sticky top-0 z-30 shadow-[0_1px_8px_rgba(27,42,30,0.01)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="overflow-hidden rounded-xl border border-[#E1E7DB]/50 dark:border-white/10 shadow-sm flex-shrink-0" aria-hidden="true">
              <img src="/logo.png" alt="Budget Pulse" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary dark:text-[#E8ECE4] font-display tracking-tight select-none">Budget Pulse</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-0.5 text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4] transition-colors rounded"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <p className="text-[11px] font-bold tracking-widest text-secondary/70 dark:text-secondary uppercase min-w-[100px] text-center">
                  {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
                </p>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-0.5 text-secondary/70 hover:text-primary dark:hover:text-[#E8ECE4] transition-colors rounded"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {!isCurrentMonth && (
                  <button
                    onClick={goToToday}
                    className="ml-1 text-[10px] font-bold text-accent-green hover:underline"
                    aria-label="Jump to current month"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content={isDarkMode ? "Light Mode" : "Dark Mode"} position="bottom">
              <button
                onClick={toggleDarkMode}
                className="p-2.5 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </Tooltip>

            <Tooltip content="Export Data" position="bottom">
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2.5 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                aria-label="Export transactions"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
              </button>
            </Tooltip>

            <Tooltip content="Manage Categories" position="bottom">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="p-2.5 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                aria-label="Manage categories"
              >
                <Tags className="w-5 h-5" aria-hidden="true" />
              </button>
            </Tooltip>

            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <Tooltip content="Account" position="bottom">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                  aria-label="Account menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-xl bg-accent-green/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-green" aria-hidden="true" />
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)' }} aria-hidden="true" />
                </button>
              </Tooltip>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal border border-white/20 dark:border-white/5 overflow-hidden animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-border-subtle dark:border-white/5">
                    <p className="text-sm font-semibold text-primary dark:text-[#E8ECE4]">{user?.email || 'Guest User'}</p>
                    <p className="text-xs text-secondary dark:text-secondary/70 mt-0.5">{isGuest ? 'Guest Mode' : 'Signed in'}</p>
                  </div>
                  <button
                    onClick={handleUserMenuLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-accent-red hover:bg-accent-red/5 dark:hover:bg-accent-red/10 transition-colors"
                    aria-label="Log out"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8" aria-label="Dashboard">
        <div className="grid md:grid-cols-[320px_1fr] gap-6 sm:gap-8 min-w-0">
          <aside className="space-y-4 min-w-0" aria-label="Monthly balance summary">
            <h2 className="text-xs font-bold text-secondary dark:text-secondary uppercase tracking-widest font-sans mb-1">Balance</h2>
            
            {editingIncome ? (
              <div className="card p-5 animate-scale-in border-accent-green/20 bg-accent-green/[0.01] glow-outline">
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary mb-2">Base Monthly Income</label>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-semibold">₹</span>
                     <input
                       type="number"
                       value={newIncome}
                       onChange={(e) => setNewIncome(e.target.value)}
                       className="input-field pl-7 font-display font-bold text-lg"
                       placeholder="0.00"
                       autoFocus
                     />
                   </div>
                  <button
                    onClick={handleSaveIncome}
                    className="btn-primary px-4"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <Tooltip content="Edit base income" position="right">
                <div
                  onClick={() => {
                    setNewIncome(income.toString())
                    setEditingIncome(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setNewIncome(income.toString())
                      setEditingIncome(true)
                    }
                  }}
                  className="card p-5 cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 group select-none border-[#E1E7DB] dark:border-white/5 glow-outline"
                  role="button"
                  tabIndex={0}
                  aria-label="Set monthly income"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/80 dark:text-secondary mb-1 group-hover:text-accent-green transition-colors">Tap to set base income</p>
                      <p className="text-2xl font-bold text-primary dark:text-[#E8ECE4] font-display">₹{income.toFixed(2)}</p>
                    </div>
                    <Settings className="w-4 h-4 text-secondary/40 group-hover:text-accent-green group-hover:rotate-45 transition-all duration-300" aria-hidden="true" />
                  </div>
                </div>
              </Tooltip>
            )}

            <div className="space-y-3.5">
              <div className="glow-outline rounded-2xl animate-stagger-in stagger-1">
                <BalanceCard title="Income" amount={totalIncome} variant="income" />
              </div>
              <div className="glow-outline rounded-2xl animate-stagger-in stagger-2">
                <BalanceCard title="Expenses" amount={totalExpenses} variant="expense" />
              </div>
              <div className="glow-outline rounded-2xl animate-stagger-in stagger-3">
                <BalanceCard title="Remaining" amount={remainingBalance} variant="balance" />
              </div>
            </div>
          </aside>

          <section aria-label="Recent transactions" className="space-y-4 min-w-0">
            <div className="flex justify-between items-center max-sm:flex-wrap max-sm:gap-y-2">
              <h2 className="text-xs font-bold text-secondary dark:text-secondary uppercase tracking-widest font-sans mb-1">Recent Transactions</h2>
              <div className="flex items-center gap-2.5">
                {voiceError && (
                  <p className="text-xs text-accent-red font-medium max-w-48 text-right animate-fade-in" role="alert">{voiceError}</p>
                )}
                <Tooltip content="Voice Command">
                  <VoiceMicButton
                    onResult={handleVoiceResult}
                    onError={handleVoiceError}
                  />
                </Tooltip>
                <Tooltip content="Export Data">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 max-sm:gap-1.5 px-3.5 max-sm:px-2 py-2.5 max-sm:py-2 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                    aria-label="Export transactions"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </Tooltip>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm max-sm:text-xs shadow-md max-sm:px-3 max-sm:py-2"
                  aria-label="Add a new transaction"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Transaction
                </button>
              </div>
            </div>

            <div className="card p-5 glow-outline">
              {isLoadingTransactions ? (
                <div className="space-y-3" role="status" aria-label="Loading your data">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 animate-pulse">
                      <div className="w-11 h-11 bg-[#EEF1EB] dark:bg-white/5 rounded-xl border border-[#E1E6DC] dark:border-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#EEF1EB] dark:bg-white/5 rounded w-24" />
                        <div className="h-3 bg-[#EEF1EB] dark:bg-white/5 rounded w-36" />
                      </div>
                      <div className="h-4 bg-[#EEF1EB] dark:bg-white/5 rounded w-16" />
                    </div>
                  ))}
                  <span className="sr-only">Loading your data</span>
                </div>
              ) : transactionsError ? (
                <div className="text-center py-8 space-y-3" role="alert">
                  <p className="text-sm text-accent-red font-medium">
                    Couldn't load your transactions. Please try again.
                  </p>
                  <button
                    onClick={() => refetchTransactions()}
                    className="btn-secondary px-4 py-2 text-sm"
                    aria-label="Retry loading transactions"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <TransactionList
                  transactions={transactions}
                  categoryMeta={categoryMeta}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              )}
            </div>
          </section>
        </div>

        <AddExpenseModal 
          isOpen={showExpenseModal} 
          onClose={() => {
            setShowExpenseModal(false)
            setEditingTransaction(null)
            setVoicePrefill(null)
          }}
          editTransaction={editingTransaction}
          voicePrefill={voicePrefill}
          currentBalance={remainingBalance}
        />

        <Suspense fallback={null}>
          <CategoryManager
            isOpen={showCategoryManager}
            onClose={() => setShowCategoryManager(false)}
          />
        </Suspense>

        <Suspense fallback={null}>
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            userId={activeUserId || ''}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </Suspense>
      </main>
    </div>
  )
}
