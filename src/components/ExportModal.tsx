import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Download, FileText, Check } from 'lucide-react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { generateCSV, generateXLSX, getExportFilename } from '../lib/export'
import type { ExportFormat } from '../lib/export'
import type { Transaction } from '../types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  selectedMonth?: number
  selectedYear?: number
}

type DatePreset = 'thisMonth' | 'lastMonth' | 'last3' | 'custom'

export function ExportModal({ isOpen, onClose, userId: _userId, selectedMonth, selectedYear }: ExportModalProps) {
  const store = useDataStore()
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [dateFrom, setDateFrom] = useState(format(firstOfMonth, 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(today, 'yyyy-MM-dd'))
  const [preset, setPreset] = useState<DatePreset>('thisMonth')
  const [fileFormat, setFileFormat] = useState<ExportFormat>('csv')
  const [includeSummary, setIncludeSummary] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [onClose])

  // Update date range when modal opens or when selected month/year changes
  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    setError('')
    setIsSuccess(false)
    setIsExporting(false)

    const targetMonth = selectedMonth ?? today.getMonth() + 1
    const targetYear = selectedYear ?? today.getFullYear()
    const isCurrentMonth = targetMonth === today.getMonth() + 1 && targetYear === today.getFullYear()

    if (!isCurrentMonth) {
      // Viewing a historical month - set range to that full month
      const first = new Date(targetYear, targetMonth - 1, 1)
      const last = new Date(targetYear, targetMonth, 0)
      setDateFrom(format(first, 'yyyy-MM-dd'))
      setDateTo(format(last, 'yyyy-MM-dd'))
      setPreset('custom')
    } else {
      // Current month - default to this month so far
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setPreset('thisMonth')
      setDateFrom(format(firstOfMonth, 'yyyy-MM-dd'))
      setDateTo(format(today, 'yyyy-MM-dd'))
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      if (successTimer.current) clearTimeout(successTimer.current)
    }
  }, [isOpen, selectedMonth, selectedYear, handleKeyDown])

  const applyPreset = (p: Exclude<DatePreset, 'custom'>) => {
    // Use the selected month/year context if available, otherwise current date
    const targetMonth = selectedMonth ?? today.getMonth() + 1
    const targetYear = selectedYear ?? today.getFullYear()

    if (p === 'thisMonth') {
      const first = new Date(targetYear, targetMonth - 1, 1)
      setDateFrom(format(first, 'yyyy-MM-dd'))
      setDateTo(format(new Date(targetYear, targetMonth, 0), 'yyyy-MM-dd'))
    } else if (p === 'lastMonth') {
      const first = new Date(targetYear, targetMonth - 2, 1)
      const last = new Date(targetYear, targetMonth - 1, 0)
      setDateFrom(format(first, 'yyyy-MM-dd'))
      setDateTo(format(last, 'yyyy-MM-dd'))
    } else {
      const first = new Date(targetYear, targetMonth - 3, 1)
      setDateFrom(format(first, 'yyyy-MM-dd'))
      setDateTo(format(new Date(targetYear, targetMonth, 0), 'yyyy-MM-dd'))
    }
    setPreset(p)
    setError('')
  }

  const handleExport = async () => {
    setIsExporting(true)
    setIsSuccess(false)
    setError('')

    try {
      let transactions: Transaction[] = []
      if (!store) return
      transactions = await store.listTransactions(dateFrom, dateTo)
      // Sort by date ascending to match Supabase order
      transactions.sort((a, b) => a.date.localeCompare(b.date))

      if (transactions.length === 0) {
        setError('No transactions found in this date range.')
        setIsExporting(false)
        return
      }

      const blob = fileFormat === 'csv'
        ? await generateCSV(transactions, includeSummary)
        : await generateXLSX(transactions, includeSummary)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = getExportFilename(fileFormat)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setIsExporting(false)
      setIsSuccess(true)
      successTimer.current = setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const presetBtn = (id: Exclude<DatePreset, 'custom'>, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => applyPreset(id)}
      aria-pressed={preset === id}
      className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
        preset === id
          ? 'bg-accent-green text-white shadow-sm'
          : 'bg-[#EEF1EB] dark:bg-white/5 text-secondary hover:text-primary dark:hover:text-[#E8ECE4]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-heading"
    >
      <div className="absolute inset-0 bg-primary/20 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div ref={modalRef} className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-[90vw] max-w-md p-4 sm:p-6 animate-scale-in border border-white/20 dark:border-white/5 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 min-w-[40px] min-h-[40px] text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pr-10">
          <h2 id="export-modal-heading" className="text-xl font-bold text-primary dark:text-[#E8ECE4] font-display">Export Transactions</h2>
          <p className="text-xs text-secondary dark:text-secondary/70 mt-1 font-sans">Download your transactions as CSV or XLSX</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-red/10 text-accent-red rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}
        {isSuccess && (
          <div className="mb-4 p-3 bg-accent-green/10 text-accent-green rounded-xl text-sm font-medium flex items-center gap-2 animate-scale-in" role="status">
            <Check className="w-4 h-4" />
            Export downloaded.
          </div>
        )}

        <div className="space-y-5">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">Range</span>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {presetBtn('thisMonth', 'This month')}
              {presetBtn('lastMonth', 'Last month')}
              {presetBtn('last3', 'Last 3 months')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-1.5" htmlFor="export-from">From</label>
                <input
                  id="export-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPreset('custom') }}
                  className="input-field"
                  max={dateTo}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-1.5" htmlFor="export-to">To</label>
                <input
                  id="export-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPreset('custom') }}
                  className="input-field"
                  min={dateFrom}
                />
              </div>
            </div>
            {preset === 'custom' && (
              <p className="mt-2 text-xs text-secondary/70">Custom range selected.</p>
            )}
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-1.5">Format</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Export format">
              <button
                type="button"
                role="radio"
                aria-checked={fileFormat === 'csv'}
                onClick={() => setFileFormat('csv')}
                className={`flex items-center gap-3 min-h-[56px] p-3 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                  fileFormat === 'csv'
                    ? 'border-accent-green bg-accent-green/5 dark:bg-accent-green/10'
                    : 'border-border-subtle dark:border-white/5 hover:border-[#E8ECE4] dark:hover:border-white/10'
                }`}
              >
                <FileText className={`w-5 h-5 flex-shrink-0 ${fileFormat === 'csv' ? 'text-accent-green' : 'text-secondary dark:text-secondary/70'}`} />
                <span>
                  <span className="block text-sm font-semibold text-primary dark:text-[#E8ECE4]">CSV</span>
                  <span className="block text-[11px] text-secondary dark:text-secondary/70">Excel compatible</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={fileFormat === 'xlsx'}
                onClick={() => setFileFormat('xlsx')}
                className={`flex items-center gap-3 min-h-[56px] p-3 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                  fileFormat === 'xlsx'
                    ? 'border-accent-green bg-accent-green/5 dark:bg-accent-green/10'
                    : 'border-border-subtle dark:border-white/5 hover:border-[#E8ECE4] dark:hover:border-white/10'
                }`}
              >
                <Download className={`w-5 h-5 flex-shrink-0 ${fileFormat === 'xlsx' ? 'text-accent-green' : 'text-secondary dark:text-secondary/70'}`} />
                <span>
                  <span className="block text-sm font-semibold text-primary dark:text-[#E8ECE4]">XLSX</span>
                  <span className="block text-[11px] text-secondary dark:text-secondary/70">Excel workbook</span>
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={includeSummary}
            onClick={() => setIncludeSummary(v => !v)}
            className="w-full flex items-center gap-3 min-h-[56px] p-3 rounded-2xl border border-border-subtle dark:border-white/5 hover:bg-[#F9FAF8] dark:hover:bg-white/5 transition-colors text-left select-none"
          >
            <span className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${includeSummary ? 'bg-accent-green' : 'bg-primary/15 dark:bg-white/15'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${includeSummary ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-primary dark:text-[#E8ECE4]">Include category summary</span>
              <span className="block text-[11px] text-secondary dark:text-secondary/70">Adds a breakdown by category</span>
            </span>
          </button>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 min-h-[44px]"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-primary flex-1 min-h-[44px] flex items-center justify-center gap-2"
              disabled={isExporting || isSuccess}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Done
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
