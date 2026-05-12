# Phase 1: Foundation & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 1-Foundation & Dashboard
**Areas discussed:** Dashboard Layout, Default Categories, Auth UI Flow, Database Schema

---

## Dashboard Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked (Recommended) | Balance card at top, transactions list below | |
| Split panel | Balance on left, transactions on right | ✓ |
| Grid with sidebar | Two-column grid on desktop, stacked on mobile | |

**User's choice:** Split panel
**Notes:** Clean separation of balance metrics and transaction history

---

## Balance Emphasis

| Option | Description | Selected |
|--------|-------------|----------|
| Large & color-coded | Large font, color-coded (green positive, red negative) | ✓ |
| Bold neutral | Bold but neutral color | |
| Soft background card | Large number with subtle background tint | |

**User's choice:** Large & color-coded
**Notes:** Clear visual feedback on financial position

---

## Metric Cards

| Option | Description | Selected |
|--------|-------------|----------|
| Single card (Recommended) | One large balance card (income, expenses, remaining) | |
| Three cards | Income, expenses, remaining as separate cards | ✓ |

**User's choice:** Three cards
**Notes:** Better visual separation of each metric

---

## Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state card | Show empty state with prominent Add Expense button | |
| Zero balance with hint | Balance at 0, guide text below balance | ✓ |

**User's choice:** Zero balance with hint
**Notes:** Simple, minimal approach

---

## Mobile Responsiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — responsive layout | Desktop split becomes stacked on mobile | ✓ |
| No — always split | Split panel on all sizes | |

**User's choice:** Yes — responsive layout
**Notes:** Mobile-first approach

---

## Default Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Essential 7 (Recommended) | Food, Transport, Utilities, Entertainment, Shopping, Health, Other | ✓ |
| Expanded 8-9 | Groceries, Dining, Transport, Bills, Entertainment, Shopping, Health, Home, Other | |
| Let me pick | Custom category selection | |

**User's choice:** Essential 7
**Notes:** Keep it minimal for MVP

---

## Auth UI Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | Clean, simple modal over dashboard | ✓ |
| Dedicated pages | Redirect to /login and /signup pages | |
| Tabbed form on main page | Tabbed form on the main page | |

**User's choice:** Modal dialog
**Notes:** Non-intrusive, stays on dashboard

---

## Database Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Standard 3-table | users, transactions (with user_id, amount, category, note, date), monthly_settings (income, month) | ✓ |
| Simplified 2-table | Combine transactions and monthly_settings into single table | |

**User's choice:** Standard 3-table
**Notes:** Proper separation of concerns

---

## Agent's Discretion

- Auth validation error messages — standard Supabase error handling
- Transaction list sorting — default to most recent first
- Mobile breakpoint — standard Tailwind breakpoints (sm/md/lg)

