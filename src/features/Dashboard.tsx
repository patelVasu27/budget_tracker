import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { LogOut, Plus, Settings } from 'lucide-react'
import { VoiceMicButton } from '../components/VoiceMicButton'
import { parseAmount } from '../hooks/useAmountParser'
import { matchCategory } from '../lib/categoryMatcher'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { BalanceCard } from '../components/BalanceCard'
import { TransactionList } from '../components/TransactionList'
import { AddExpenseModal } from '../components/AddExpenseModal'
import type { Transaction, MonthlySettings } from '../types'

export function Dashboard() {
  const { user, clearSession } = useAuthStore()
  const queryClient = useQueryClient()
  const [income, setIncome] = useState(0)
  const [editingIncome, setEditingIncome] = useState(false)
  const [newIncome, setNewIncome] = useState('')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [voicePrefill, setVoicePrefill] = useState<{ amount: number; category: string; note: string } | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 1

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const { data: settings } = useQuery<MonthlySettings | null>({
    queryKey: ['monthlySettings', user?.id, currentMonth, currentYear],
    queryFn: async () => {
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
    enabled: !!user,
  })

  const { data: transactions = [], isPending: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', user?.id, currentMonth, currentYear],
    queryFn: async () => {
      if (!user) return []
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
      return data || []
    },
    enabled: !!user,
  })

  const saveIncomeMutation = useMutation({
    mutationFn: async (newIncomeValue: number) => {
      if (!user) return
      if (settings) {
        await supabase
          .from('monthly_settings')
          .update({ income: newIncomeValue, updated_at: new Date().toISOString() })
          .eq('id', settings.id)
      } else {
        await supabase.from('monthly_settings').insert({
          user_id: user.id,
          income: newIncomeValue,
          month: currentMonth,
          year: currentYear,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlySettings'] })
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('transactions').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const handleVoiceResult = (transcript: string) => {
    console.log('Voice transcript:', transcript)
    setVoiceError(null)
    const amount = parseAmount(transcript)
    console.log('Parsed amount:', amount)
    if (!amount) {
      if (retryCount < MAX_RETRIES) {
        setRetryCount((c) => c + 1)
        setVoiceError("Couldn't detect an amount. Tap the mic to try again.")
      } else {
        setVoiceError("Voice didn't work this time. Use the form below to add your expense.")
      }
      return
    }
    const { bestGuess } = matchCategory(transcript)
    const note = transcript
      .replace(/\d+(?:\.\d{1,2})?/g, '')
      .replace(/[₹₨]/g, '')
      .replace(/\b(?:rs\.?|rupees?|inr)\b\s*\d+/gi, '')
      .replace(/\b\d+\s*(?:rs\.?|rupees?|inr)\b/gi, '')
      .replace(/\s+/g, ' ').trim()
    setVoicePrefill({ amount, category: bestGuess, note })
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

  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const remainingBalance = income - totalExpenses

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
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">SimpleBudget</h1>
              <p className="text-xs text-secondary">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-elevated rounded-lg transition-colors"
            aria-label="Log out of your account"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8" aria-label="Dashboard">
        <div className="grid md:grid-cols-[320px_1fr] gap-8">
          <aside className="space-y-4" aria-label="Monthly balance summary">
            <h2 className="text-sm font-medium text-secondary uppercase tracking-wide">Balance</h2>
            
            {editingIncome ? (
              <div className="card p-5 animate-scale-in">
                <label className="block text-xs text-secondary mb-2">Monthly Income</label>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">₹</span>
                     <input
                       type="number"
                       value={newIncome}
                       onChange={(e) => setNewIncome(e.target.value)}
                       className="input-field pl-7"
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
                className="card p-5 cursor-pointer hover:shadow-elevated transition-all duration-200 group"
                role="button"
                tabIndex={0}
                aria-label="Set monthly income"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-secondary mb-1">Tap to set income</p>
                    <p className="text-2xl font-semibold text-primary">₹{income.toFixed(2)}</p>
                  </div>
                  <Settings className="w-4 h-4 text-secondary/40 group-hover:text-secondary transition-colors" aria-hidden="true" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <BalanceCard title="Income" amount={income} variant="income" />
              <BalanceCard title="Expenses" amount={totalExpenses} variant="expense" />
              <BalanceCard title="Remaining" amount={remainingBalance} variant="balance" />
            </div>
          </aside>

          <section aria-label="Recent expenses">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium text-secondary uppercase tracking-wide">Recent Expenses</h2>
              <div className="flex items-center gap-2">
                {voiceError && (
                  <p className="text-xs text-accent-red max-w-48 text-right" role="alert">{voiceError}</p>
                )}
                <VoiceMicButton
                  onResult={handleVoiceResult}
                  onError={handleVoiceError}
                />
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                  aria-label="Add a new expense"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Expense
                </button>
              </div>
            </div>

            <div className="card p-4">
              {isLoadingTransactions ? (
                <div className="space-y-3" role="status" aria-label="Loading your data">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-primary/5 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-primary/5 rounded w-24" />
                        <div className="h-3 bg-primary/5 rounded w-36" />
                      </div>
                      <div className="h-4 bg-primary/5 rounded w-16" />
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
      </main>
    </div>
  )
}