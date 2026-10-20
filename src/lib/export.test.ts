import { describe, it, expect } from 'vitest'
import { generateCSV, generateXLSX, getExportFilename } from './export'
import type { Transaction } from '../types'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    amount: 10.5,
    type: 'expense',
    category: 'Food',
    category_id: 'cat-1',
    note: 'Lunch',
    date: '2026-01-15',
    created_at: '2026-01-15T12:00:00Z',
    ...overrides,
  }
}

describe('export — formula injection prevention (CWE-1236)', () => {
  // Helper: generate CSV and return its text content
  async function csvText(tx: Transaction): Promise<string> {
    const blob = await generateCSV([tx], false)
    return await blob.text()
  }

  it('prefixes notes starting with = with a single quote', async () => {
    const text = await csvText(makeTx({ note: '=HYPERLINK("http://evil.com","click")' }))
    expect(text).toContain("'=HYPERLINK")
  })

  it('prefixes notes starting with + with a single quote', async () => {
    const text = await csvText(makeTx({ note: '+SUM(A1:A10)' }))
    expect(text).toContain("'+SUM")
  })

  it('prefixes notes starting with - with a single quote', async () => {
    const text = await csvText(makeTx({ note: '-5+3' }))
    expect(text).toContain("'-5+3")
  })

  it('prefixes notes starting with @ with a single quote', async () => {
    const text = await csvText(makeTx({ note: '@SUM(A1)' }))
    expect(text).toContain("'@SUM")
  })

  it('prefixes notes starting with a tab with a single quote', async () => {
    const text = await csvText(makeTx({ note: '\t=cmd' }))
    expect(text).toContain("'\t=cmd")
  })

  it('does not modify normal notes', async () => {
    const text = await csvText(makeTx({ note: 'Lunch at restaurant' }))
    expect(text).toContain('Lunch at restaurant')
    expect(text).not.toContain("'Lunch")
  })

  it('still escapes commas and quotes correctly', async () => {
    const text = await csvText(makeTx({ note: 'He said "hi", then left' }))
    expect(text).toContain('"He said ""hi"", then left"')
  })

  it('neutralizes formula injection in category names', async () => {
    const text = await csvText(makeTx({ category: '=CMD' }))
    expect(text).toContain("'=CMD")
  })

  it('generates valid XLSX without throwing', async () => {
    const blob = await generateXLSX([makeTx({ note: '=HYPERLINK("http://evil.com","click")' })], true)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it('getExportFilename returns correct extension', () => {
    const name = getExportFilename('csv')
    expect(name).toMatch(/\.csv$/)
    const xlsxName = getExportFilename('xlsx')
    expect(xlsxName).toMatch(/\.xlsx$/)
  })
})

describe('export — cents arithmetic (no float drift)', () => {
  async function csvText(tx: Transaction): Promise<string> {
    const blob = await generateCSV([tx], true)
    return await blob.text()
  }

  it('sums 0.1 + 0.2 without float drift', async () => {
    const tx1 = makeTx({ amount: 0.1, note: 'a' })
    const tx2 = makeTx({ amount: 0.2, note: 'b', id: 'tx-2' })
    const blob = await generateCSV([tx1, tx2], true)
    const text = await blob.text()
    // Summary total should be 0.30, not 0.30000000000000004
    expect(text).toContain('0.30')
    expect(text).not.toContain('0.30000000000000004')
  })

  it('handles exact-cent input like 10.05', async () => {
    const tx = makeTx({ amount: 10.05 })
    const text = await csvText(tx)
    expect(text).toContain('10.05')
  })

  it('handles zero-value transaction', async () => {
    const tx = makeTx({ amount: 0 })
    const text = await csvText(tx)
    expect(text).toContain('0.00')
  })

  it('handles single large value', async () => {
    const tx = makeTx({ amount: 99999.99 })
    const text = await csvText(tx)
    expect(text).toContain('99999.99')
  })
})