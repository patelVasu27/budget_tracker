# Requirements: SimpleBudget

**Defined:** 2026-05-12
**Core Value:** Users can log an expense and see their remaining balance in under 5 seconds.

## v1 Requirements

### Dashboard

- [x] **DASH-01**: User sees monthly income/starting balance prominently displayed
- [x] **DASH-02**: User sees total expenses clearly
- [x] **DASH-03**: User sees remaining balance (visually emphasized)
- [x] **DASH-04**: User sees recent transactions list
- [x] **DASH-05**: No charts, tabs, or hidden calculations

### Expense Entry

- [x] **EXP-01**: User can add expense with amount, category, optional note, date
- [x] **EXP-02**: Date field defaults to today
- [x] **EXP-03**: Category dropdown with predefined categories
- [x] **EXP-04**: Expense saves to Supabase instantly
- [x] **EXP-05**: Dashboard updates immediately after save
- [x] **EXP-06**: Maximum 4 fields per form

### Transactions

- [x] **TRAN-01**: User can view chronological list of expenses
- [x] **TRAN-02**: Each transaction shows amount, category, date, note
- [x] **TRAN-03**: User can edit existing transaction
- [x] **TRAN-04**: User can delete transaction with confirmation
- [x] **TRAN-05**: Balance recalculates after edit/delete

### Monthly Balance

- [x] **BAL-01**: User can set monthly income or starting balance
- [x] **BAL-02**: System subtracts expenses from balance automatically
- [x] **BAL-03**: Balance updates in real-time after any change
- [x] **BAL-04**: No complex category budgets in MVP

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in with email and password
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User can log out
- [x] **AUTH-05**: Row-Level Security protects user data (SQL script ready)

### Voice Entry

- [x] **VOIC-01**: User can tap microphone to start voice input
- [x] **VOIC-02**: Browser requests microphone permission on first use
- [x] **VOIC-03**: System extracts amount from speech
- [x] **VOIC-04**: System matches category from keywords
- [x] **VOIC-05**: Form pre-fills with extracted data
- [x] **VOIC-06**: User must confirm before saving (no auto-save)
- [x] **VOIC-07**: Graceful fallback if browser doesn't support Web Speech API

## v2 Requirements

### History

- **HIST-01**: User can view previous months' transaction lists
- **HIST-02**: User can switch between months with simple selector

### Data

- **DATA-01**: User can export transactions as CSV
- **DATA-02**: User can add custom categories

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bank account linking | Adds complexity, privacy concerns, monthly fees |
| Investment tracking | Not a budgeting tool, different use case |
| Advanced analytics/charts | Adds cognitive load, MVP focuses on clarity |
| Multi-currency support | Adds complexity for small user benefit |
| Recurring automation | Defer to future when core is stable |
| Native mobile apps | PWA first, wrap later if needed |
| Subscription tiers | Always free and open source |
| AI-powered insights | Counter to minimalist philosophy |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 1 | Complete |
| DASH-02 | Phase 1 | Complete |
| DASH-03 | Phase 1 | Complete |
| DASH-04 | Phase 1 | Complete |
| DASH-05 | Phase 1 | Complete |
| EXP-01 | Phase 2 | Complete |
| EXP-02 | Phase 2 | Complete |
| EXP-03 | Phase 2 | Complete |
| EXP-04 | Phase 2 | Complete |
| EXP-05 | Phase 2 | Complete |
| EXP-06 | Phase 2 | Complete |
| TRAN-01 | Phase 2 | Complete |
| TRAN-02 | Phase 2 | Complete |
| TRAN-03 | Phase 2 | Complete |
| TRAN-04 | Phase 2 | Complete |
| TRAN-05 | Phase 2 | Complete |
| BAL-01 | Phase 1 | Complete |
| BAL-02 | Phase 1 | Complete |
| BAL-03 | Phase 1 | Complete |
| BAL-04 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| VOIC-01 | Phase 3 | Complete |
| VOIC-02 | Phase 3 | Complete |
| VOIC-03 | Phase 3 | Complete |
| VOIC-04 | Phase 3 | Complete |
| VOIC-05 | Phase 3 | Complete |
| VOIC-06 | Phase 3 | Complete |
| VOIC-07 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-05-12*
*Last updated: 2026-05-12 after initial definition*