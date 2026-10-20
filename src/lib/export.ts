import type { Transaction } from '../types'

// Neutralizes CSV/Excel formula injection (CWE-1236).
// Values starting with =, +, -, @, TAB, or CR are prefixed with a single quote
// so spreadsheet apps treat them as text instead of executing them as formulas.
function neutralizeFormula(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value
  }
  return value
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  const safe = neutralizeFormula(str)
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

function waitForIdle(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: 50 })
    } else {
      setTimeout(resolve, 0)
    }
  })
}

const CHUNK_SIZE = 1000

export type ExportFormat = 'csv' | 'xlsx'

export async function generateCSV(
  transactions: Transaction[],
  includeSummary: boolean
): Promise<Blob> {
  const rows: string[] = []
  rows.push('Date,Amount,Type,Category,Note')

  for (let i = 0; i < transactions.length; i++) {
    if (i > 0 && i % CHUNK_SIZE === 0) await waitForIdle()
    const tx = transactions[i]
    rows.push([
      escapeCSV(tx.date),
      escapeCSV(tx.amount.toFixed(2)),
      escapeCSV(tx.type || 'expense'),
      escapeCSV(tx.category),
      escapeCSV(tx.note),
    ].join(','))
  }

  if (includeSummary && transactions.length > 0) {
    rows.push('')
    rows.push('Category Summary')
    rows.push('Category,Type,Count,Total Amount')

    const summary = new Map<string, { count: number; totalCents: number; type: string }>()
    for (const tx of transactions) {
      const cat = tx.category || 'Uncategorized'
      const type = tx.type || 'expense'
      const prev = summary.get(cat) ?? { count: 0, totalCents: 0, type }
      prev.count++
      prev.totalCents += Math.round(tx.amount * 100)
      summary.set(cat, prev)
    }

    for (const [category, { count, totalCents, type }] of summary) {
      rows.push([escapeCSV(category), escapeCSV(type), escapeCSV(count), escapeCSV((totalCents / 100).toFixed(2))].join(','))
    }
  }

  const content = '\uFEFF' + rows.join('\r\n')
  return new Blob([content], { type: 'text/csv;charset=utf-8;' })
}

export async function generateXLSX(
  transactions: Transaction[],
  includeSummary: boolean
): Promise<Blob> {
  // Lazy-load xlsx (SheetJS) on demand — it is ~600 kB raw and only needed
  // when the user explicitly exports to XLSX. Never loaded on initial page load.
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  const txData = transactions.map((tx) => ({
    Date: neutralizeFormula(tx.date),
    Amount: tx.amount,
    Type: neutralizeFormula(tx.type || 'expense'),
    Category: neutralizeFormula(tx.category),
    Note: neutralizeFormula(tx.note || ''),
  }))
  const txSheet = XLSX.utils.json_to_sheet(txData)
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions')

  if (includeSummary && transactions.length > 0) {
    const summary = new Map<string, { count: number; totalCents: number; type: string }>()
    for (const tx of transactions) {
      const cat = tx.category || 'Uncategorized'
      const type = tx.type || 'expense'
      const prev = summary.get(cat) ?? { count: 0, totalCents: 0, type }
      prev.count++
      prev.totalCents += Math.round(tx.amount * 100)
      summary.set(cat, prev)
    }

    const summaryData = Array.from(summary.entries()).map(([category, { count, totalCents, type }]) => ({
      Category: neutralizeFormula(category),
      Type: neutralizeFormula(type),
      Count: count,
      'Total Amount': parseFloat((totalCents / 100).toFixed(2)),
    }))

    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Category Summary')
  }

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function getExportFilename(format: ExportFormat): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return `BudgetPulse_${dateStr}.${format}`
}
