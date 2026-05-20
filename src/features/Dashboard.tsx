import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Download, LogOut, Plus, Settings, Tags, Sun, Moon } from 'lucide-react'
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
import { CategoryManager } from './CategoryManager'
import { ExportModal } from '../components/ExportModal'
import { Tooltip } from '../components/Tooltip'
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

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const activeUserId = isGuest ? 'guest' : user?.id

  const { data: settings } = useQuery<MonthlySettings | null>({
    queryKey: ['monthlySettings', activeUserId, currentMonth, currentYear],
    queryFn: async () => {
      if (isGuest) {
        const key = `guest_settings_${currentYear}_${currentMonth}`
        const local = localStorage.getItem(key)
        if (local) return JSON.parse(local) as MonthlySettings
        
        const defaultSettings: MonthlySettings = {
          id: 'guest-settings',
          user_id: 'guest',
          income: 0,
          month: currentMonth,
          year: currentYear,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        localStorage.setItem(key, JSON.stringify(defaultSettings))
        return defaultSettings
      }
      if (!user) return null
      const { data } = await supabase
        .from('monthly_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()
      return data
    },
    enabled: !!activeUserId,
  })

  const { data: transactions = [], isPending: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', activeUserId, currentMonth, currentYear],
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem('guest_transactions')
        const initialized = localStorage.getItem('guest_initialized')
        let allTransactions: Transaction[] = []
        let parseFailed = false

        if (local !== null) {
          try {
            allTransactions = JSON.parse(local) as Transaction[]
            if (!Array.isArray(allTransactions)) {
              allTransactions = []
            }
          } catch (e) {
            console.error('Failed to parse guest_transactions:', e)
            parseFailed = true
          }
        }

        if (initialized !== 'true' || local === null || parseFailed) {
          const today = format(new Date(), 'yyyy-MM-dd')
          const defaultTransactions: Transaction[] = [
            {
              id: 'tx-salary',
              user_id: 'guest',
              amount: 25000,
              type: 'income',
              category: 'Salary',
              category_id: 'cat-salary',
              note: 'Seeded monthly income',
              date: today,
              created_at: new Date().toISOString()
            },
            {
              id: 'tx-food',
              user_id: 'guest',
              amount: 250,
              type: 'expense',
              category: 'Food',
              category_id: 'cat-food',
              note: 'Dinner at restaurant',
              date: today,
              created_at: new Date(Date.now() - 1000).toISOString()
            },
            {
              id: 'tx-transport',
              user_id: 'guest',
              amount: 150,
              type: 'expense',
              category: 'Transport',
              category_id: 'cat-transport',
              note: 'Uber ride',
              date: today,
              created_at: new Date(Date.now() - 2000).toISOString()
            }
          ]
          localStorage.setItem('guest_transactions', JSON.stringify(defaultTransactions))
          localStorage.setItem('guest_initialized', 'true')
          allTransactions = defaultTransactions
        }

        const filtered = allTransactions.filter(tx => {
          if (!tx.date || typeof tx.date !== 'string') return false
          const parts = tx.date.split('-')
          if (parts.length < 2) return false
          const year = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10)
          return year === currentYear && month === currentMonth
        })

        filtered.sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date)
          if (dateDiff !== 0) return dateDiff
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        return filtered
      }

      if (!user) return []
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const lastDay = new Date(currentYear, currentMonth, 0)
      const endDate = format(lastDay, 'yyyy-MM-dd')
      
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
      return data || []
    },
    enabled: !!activeUserId,
  })

  const saveIncomeMutation = useMutation({
    mutationFn: async (newIncomeValue: number) => {
      if (isGuest) {
        const key = `guest_settings_${currentYear}_${currentMonth}`
        const newSettings: MonthlySettings = {
          id: settings?.id || 'guest-settings',
          user_id: 'guest',
          income: newIncomeValue,
          month: currentMonth,
          year: currentYear,
          created_at: settings?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        localStorage.setItem(key, JSON.stringify(newSettings))
        return newSettings
      }
      if (!user) return
      if (settings) {
        const { error } = await supabase
          .from('monthly_settings')
          .update({ income: newIncomeValue, updated_at: new Date().toISOString() })
          .eq('id', settings.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('monthly_settings').insert({
          user_id: user.id,
          income: newIncomeValue,
          month: currentMonth,
          year: currentYear,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlySettings'] })
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        const local = localStorage.getItem('guest_transactions')
        if (local) {
          try {
            const transactions: Transaction[] = JSON.parse(local)
            if (Array.isArray(transactions)) {
              const filtered = transactions.filter(tx => tx.id !== id)
              localStorage.setItem('guest_transactions', JSON.stringify(filtered))
            }
          } catch (e) {
            console.error('Failed to parse guest_transactions during deletion:', e)
          }
        }
        return
      }
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
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

    console.info('[Voice Parsing]', { transcript, amount, category: bestGuess, note: cleanNote })
    
    const isIncome = /\b(?:received|earned|income|salary|bonus|gift|freelance|sold|deposit|interest|dividend)\b/i.test(transcript)
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

  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalIncomeTransactions = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalIncome = income + totalIncomeTransactions
  const remainingBalance = totalIncome - totalExpenses

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

  return (
    <div className="min-h-screen bg-background dark:bg-[#0F1410] transition-colors duration-300">
      <header className="glass-nav sticky top-0 z-30 shadow-[0_1px_8px_rgba(27,42,30,0.01)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl border border-[#E1E7DB]/50 dark:border-white/10 shadow-sm flex-shrink-0" aria-hidden="true">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-black text-primary dark:text-[#E8ECE4] font-display tracking-tight select-none">SimpleBudget</h1>
              <p className="text-[10px] font-bold tracking-widest text-secondary/80 dark:text-secondary uppercase mt-0.5">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Tooltip content={isDarkMode ? "Light Mode" : "Dark Mode"}>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </Tooltip>

            <Tooltip content="Manage Categories">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                aria-label="Manage categories"
              >
                <Tags className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Categories</span>
              </button>
            </Tooltip>

            <Tooltip content="Log Out">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                aria-label="Log out of your account"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8" aria-label="Dashboard">
        <div className="grid md:grid-cols-[320px_1fr] gap-8">
          <aside className="space-y-4" aria-label="Monthly balance summary">
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
              <div className="glow-outline rounded-2xl">
                <BalanceCard title="Income" amount={totalIncome} variant="income" />
              </div>
              <div className="glow-outline rounded-2xl">
                <BalanceCard title="Expenses" amount={totalExpenses} variant="expense" />
              </div>
              <div className="glow-outline rounded-2xl">
                <BalanceCard title="Remaining" amount={remainingBalance} variant="balance" />
              </div>
            </div>
          </aside>

          <section aria-label="Recent transactions" className="space-y-4">
            <div className="flex justify-between items-center">
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
                    className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-[#EEF1EB] dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                    aria-label="Export transactions"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </Tooltip>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm shadow-md"
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
              ) : (
                <TransactionList 
                  transactions={transactions} 
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
        />

        <CategoryManager
          isOpen={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
        />

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          userId={activeUserId || ''}
        />
      </main>
    </div>
  )
}