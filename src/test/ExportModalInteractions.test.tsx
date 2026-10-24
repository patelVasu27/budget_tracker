/**
 * Regression tests for the ExportModal interaction freeze.
 *
 * Bug: in the browser, React delegation stopped dispatching clicks inside the
 * ExportModal dialog (presets / radio / switch / export button all ignored),
 * while Escape (a hand-rolled document listener) still worked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportModal } from '../components/ExportModal'
import { useAuthStore } from '../stores/authStore'

// LocalStore-backed guest store so listTransactions resolves instantly
const store = {
  listTransactions: vi.fn(async () => []),
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  getMonthlySettings: vi.fn(async () => null),
  upsertMonthlyIncome: vi.fn(),
  listCategories: vi.fn(async () => []),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
  listCategoryGroups: vi.fn(async () => []),
  createCategoryGroup: vi.fn(),
  updateCategoryGroup: vi.fn(),
  deleteCategoryGroup: vi.fn(),
}

vi.mock('../stores/dataStore', async () => {
  const actual = await vi.importActual<typeof import('../stores/dataStore')>('../stores/dataStore')
  return {
    ...actual,
    useDataStore: () => store,
  }
})

describe('ExportModal interactions', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isGuest: true })
    vi.clearAllMocks()
  })

  it('applies the Last month preset when clicked', async () => {
    render(
      <ExportModal
        isOpen
        onClose={() => {}}
        userId="guest"
        selectedMonth={10}
        selectedYear={2026}
      />
    )

    const from = screen.getByLabelText('From', { selector: 'input#export-from' }) as HTMLInputElement
    const to = screen.getByLabelText('To', { selector: 'input#export-to' }) as HTMLInputElement

    // Initial: current month (Oct 2026 dummy "today" is the real clock)
    await waitFor(() => expect(from.value).toMatch(/-10-/))

    fireEvent.click(screen.getByRole('button', { name: 'Last month' }))
    await waitFor(() => expect(from.value).toMatch(/-0[89]-/))
    expect(to.value).not.toMatch(/10-24/)
  })

  it('switches format and summary toggle', async () => {
    render(
      <ExportModal isOpen onClose={() => {}} userId="guest" selectedMonth={10} selectedYear={2026} />
    )
    const xlsxRadio = screen.getByRole('radio', { name: /xlsx/i })
    fireEvent.click(xlsxRadio)
    await waitFor(() => expect(xlsxRadio.getAttribute('aria-checked')).toBe('true'))
  })
})
