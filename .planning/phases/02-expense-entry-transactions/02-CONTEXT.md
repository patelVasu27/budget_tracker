# Phase 2: Expense Entry & Transactions — Context

**Gathered:** 2026-05-14
**Status:** Pre-implemented during Phase 1 walking skeleton

<domain>
## Phase Boundary

Full expense CRUD with simple form and transaction list management. All requirements (EXP-01 to EXP-06, TRAN-01 to TRAN-05) were implemented as part of the Phase 1 walking skeleton.
</domain>

<decisions>
## Implementation Decisions

All decisions inherited from Phase 1 (D-01 through D-08):

### Expense Form
- **D-09:** Four fields — amount, category (emoji radio grid), date, optional note
- **D-10:** Date defaults to today via date-fns
- **D-11:** Categories use Phase 1's Essential 7 (Food, Transport, Utilities, Entertainment, Shopping, Health, Other)

### Transaction List
- **D-12:** Chronological order descending (most recent first)
- **D-13:** Each row shows category icon, date, note, and color-coded amount
- **D-14:** Two-click delete confirmation (first click shows checkmark, second confirms)
- **D-15:** Edit opens the same AddExpenseModal pre-filled with transaction data

### State Management
- **D-16:** React Query mutations for add/edit/delete with `invalidateQueries` for real-time dashboard updates
- **D-17:** Balance recalculated client-side: `remainingBalance = income - totalExpenses`
</decisions>

<canonical_refs>
## Canonical References

- `.planning/phases/01-foundation-dashboard/01-CONTEXT.md` — All Phase 1 decisions (D-01 to D-08)
- `src/components/AddExpenseModal.tsx` — Expense form with full CRUD
- `src/components/TransactionList.tsx` — Transaction list with edit/delete
- `src/features/Dashboard.tsx` — Dashboard wiring with React Query

</canonical_refs>

<code_context>
## Existing Code

### Files (from Phase 1 implementation)

| File | Role |
|------|------|
| `src/components/AddExpenseModal.tsx` | Expense CRUD form (add + edit) |
| `src/components/TransactionList.tsx` | Transaction list with edit/delete/empty state |
| `src/features/Dashboard.tsx` | Dashboard wiring all mutations and queries |

### Key Patterns

- React Query mutations with optimistic-like invalidation
- Two-click delete (no prompt dialog, inline confirmation)
- Emoji category selector in expense form
- Inline income editing in dashboard balance section
</code_context>

<specifics>
## Specific Ideas

- Clean, minimal expense form — no clutter
- Two-click delete avoids annoying confirmation dialogs
- Emoji category picker is visually scannable
</specifics>

<deferred>
## Deferred Ideas

None — Phase 2 scope fully covered.
</deferred>

---

*Phase: 2-Expense Entry & Transactions*
*Context gathered: 2026-05-14 (retroactive — implemented during Phase 1)*
