import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { LogOut, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { BalanceCard } from '../components/BalanceCard'
import { TransactionList } from '../components/TransactionList'
import type { Transaction, MonthlySettings } from '../types'

export function Dashboard() {
  const { user, clearSession } = useAuthStore()
  const queryClient = useQueryClient()
  const [income, setIncome] = useState(0)
  const [editingIncome, setEditingIncome] = useState(false)
  const [newIncome, setNewIncome] = useState('')

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

  const { data: transactions = [] } = useQuery<Transaction[]>({
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SimpleBudget</h1>
            <p className="text-sm text-gray-500">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Balance</h2>
            
            {editingIncome ? (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm text-gray-500 mb-1">Monthly Income</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveIncome}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <p className="text-sm text-gray-500">Tap to set income</p>
                <p className="text-2xl font-bold text-gray-900">${income.toFixed(2)}</p>
              </div>
            )}

            <BalanceCard title="Income" amount={income} variant="income" />
            <BalanceCard title="Expenses" amount={totalExpenses} variant="expense" />
            <BalanceCard title="Remaining" amount={remainingBalance} variant="balance" />
          </div>

          <div className="md:w-2/3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Expenses</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <TransactionList transactions={transactions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}