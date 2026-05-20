import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Download, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { generateCSV, generateXLSX, getExportFilename } from '../lib/export'
import type { ExportFormat } from '../lib/export'
import type { Transaction } from '../types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function ExportModal({ isOpen, onClose, userId }: ExportModalProps) {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [dateFrom, setDateFrom] = useState(format(firstOfMonth, 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(today, 'yyyy-MM-dd'))
  const [fileFormat, setFileFormat] = useState<ExportFormat>('csv')
  const [includeSummary, setIncludeSummary] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleExport = async () => {
    setIsExporting(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: true })

      if (fetchError) throw fetchError

      const transactions = (data || []) as Transaction[]

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
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-heading"
    >
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div ref={modalRef} className="relative bg-surface rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="export-modal-heading" className="text-xl font-bold text-primary font-display">Export Transactions</h2>
          <p className="text-xs text-secondary mt-1 font-sans">Download your transactions as CSV or XLSX</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-red/10 text-accent-red rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
                max={dateTo}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
                min={dateFrom}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFileFormat('csv')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  fileFormat === 'csv'
                    ? 'border-accent-green bg-accent-green/5'
                    : 'border-border-subtle hover:border-[#E8ECE4]'
                }`}
              >
                <FileText className={`w-5 h-5 ${fileFormat === 'csv' ? 'text-accent-green' : 'text-secondary'}`} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary">CSV</p>
                  <p className="text-[10px] text-secondary tracking-tight">Excel compatible</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFileFormat('xlsx')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  fileFormat === 'xlsx'
                    ? 'border-accent-green bg-accent-green/5'
                    : 'border-border-subtle hover:border-[#E8ECE4]'
                }`}
              >
                <Download className={`w-5 h-5 ${fileFormat === 'xlsx' ? 'text-accent-green' : 'text-secondary'}`} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary">XLSX</p>
                  <p className="text-[10px] text-secondary tracking-tight">Excel workbook</p>
                </div>
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:bg-[#F9FAF8] transition-colors select-none">
            <input
              type="checkbox"
              checked={includeSummary}
              onChange={(e) => setIncludeSummary(e.target.checked)}
              className="w-4 h-4 rounded border-border-color text-accent-green focus:ring-accent-green"
            />
            <div>
              <p className="text-sm font-semibold text-primary">Include category summary</p>
              <p className="text-[10px] text-secondary">Adds a breakdown by category</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
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
