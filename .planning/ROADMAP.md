# Roadmap: SimpleBudget

**Generated:** 2026-05-12
**Core Value:** Users can log an expense and see their remaining balance in under 5 seconds.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
|-------|------|------|-------------|------------------|
| 1 | Foundation & Dashboard | Set up project, auth, and monthly dashboard | DASH-01 to DASH-05, AUTH-01 to AUTH-05, BAL-01 to BAL-04 | User can sign up, see dashboard, set monthly balance |
| 2 | Expense Entry & Transactions | Full expense CRUD and transaction management | EXP-01 to EXP-06, TRAN-01 to TRAN-05 | User can add, view, edit, delete expenses |
| 3 | Voice Entry | Browser-native voice-to-expense feature | VOIC-01 to VOIC-07 | User can log expense via voice in under 5 seconds |
| 4 | Polish & Launch | Cleanup, testing, deployment | TBD | App is live and functional |

---

## Phase 1: Foundation & Dashboard

**Goal:** Project scaffold, Supabase setup, authentication, and monthly dashboard displaying balance.

**Mode:** mvp

**Success Criteria:**

1. User can sign up with email/password and log in
2. User sees monthly dashboard with income, expenses, remaining balance
3. User can set and update monthly income or starting balance
4. Dashboard updates in real-time
5. No charts, no hidden calculations, remaining balance always visible

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, BAL-01, BAL-02, BAL-03, BAL-04

**Plans:**

- [ ] 01-01-PLAN.md — Walking Skeleton: project scaffold, Supabase, auth, dashboard

---

## Phase 2: Expense Entry & Transactions

**Goal:** Full expense CRUD with simple form and transaction list management.

**Mode:** mvp

**Success Criteria:**

1. User can add expense with amount, category, optional note, date
2. Expense saves to Supabase and dashboard updates instantly
3. User can view chronological transaction list
4. User can edit existing transaction (amount, category, note, date)
5. User can delete transaction with confirmation prompt
6. Balance recalculates correctly after any change

**Requirements:** EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, EXP-06, TRAN-01, TRAN-02, TRAN-03, TRAN-04, TRAN-05

---

## Phase 3: Voice Entry

**Goal:** Browser-native voice-to-expense using Web Speech API.

**Mode:** mvp

**Success Criteria:**

1. Microphone button visible and functional
2. Browser requests microphone permission on first use
3. Speech extracts amount and category correctly
4. Form pre-fills with extracted data
5. User can edit and confirm before saving
6. Graceful fallback if browser doesn't support Web Speech API

**Requirements:** VOIC-01, VOIC-02, VOIC-03, VOIC-04, VOIC-05, VOIC-06, VOIC-07

---

## Phase 4: Polish & Launch

**Goal:** Testing, cleanup, and production deployment.

**Mode:** mvp

**Success Criteria:**

1. All core features tested and working
2. App deploys to Vercel
3. Supabase project configured for production
4. GitHub Actions CI/CD working

**Requirements:** TBD

---

## Phase Mapping

| Requirement | Phase |
|-------------|-------|
| DASH-01 | Phase 1 |
| DASH-02 | Phase 1 |
| DASH-03 | Phase 1 |
| DASH-04 | Phase 1 |
| DASH-05 | Phase 1 |
| EXP-01 | Phase 2 |
| EXP-02 | Phase 2 |
| EXP-03 | Phase 2 |
| EXP-04 | Phase 2 |
| EXP-05 | Phase 2 |
| EXP-06 | Phase 2 |
| TRAN-01 | Phase 2 |
| TRAN-02 | Phase 2 |
| TRAN-03 | Phase 2 |
| TRAN-04 | Phase 2 |
| TRAN-05 | Phase 2 |
| BAL-01 | Phase 1 |
| BAL-02 | Phase 1 |
| BAL-03 | Phase 1 |
| BAL-04 | Phase 1 |
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| AUTH-04 | Phase 1 |
| AUTH-05 | Phase 1 |
| VOIC-01 | Phase 3 |
| VOIC-02 | Phase 3 |
| VOIC-03 | Phase 3 |
| VOIC-04 | Phase 3 |
| VOIC-05 | Phase 3 |
| VOIC-06 | Phase 3 |
| VOIC-07 | Phase 3 |

---
*Generated: 2026-05-12*
*Last updated: 2026-05-12 after initial roadmap creation*