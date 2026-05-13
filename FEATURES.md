# FEATURES.md — SimpleBudget

## 1. Purpose of This Document

This document defines the features of SimpleBudget.

Each feature must:

- Directly support expense tracking
- Reduce cognitive load
- Be realistic for a solo, part-time developer
- Avoid long-term maintenance burden

If a feature adds complexity without clear user value, it does not belong.

---

# 2. Core Features (MVP)

---

## 2.1 Monthly Dashboard

### Description

A single, clean screen showing:

- Monthly income or starting balance
- Total expenses
- Remaining balance (visually emphasized)
- Recent transactions list

### User Benefit

Users instantly know:
“How much do I have left this month?”

### Design Rule

No charts. No multiple tabs. No hidden calculations.

---

## 2.2 Simple Expense Entry

### Fields

- Amount
- Category (predefined list)
- Optional note
- Date (defaults to today)

Maximum 4 inputs.

### User Benefit

Fast entry builds consistency and habit.

### Implementation Notes

- Inline form or modal
- Instant balance recalculation after save
- Transaction appears at top of list

---

## 2.3 Voice-to-Expense Entry (Free)

### Description

Hands-free expense logging using browser-native speech recognition.

### Technology

Web Speech API (Chromium-based browsers).

### Example Input

“Spent 25 dollars on groceries.”

### System Behavior

- Extracts amount
- Matches category from keywords
- Pre-fills expense form
- Requires user confirmation before saving

### User Benefit

Quick logging when typing is inconvenient.

### Constraints

- No server-side processing
- No paid APIs
- No auto-save without confirmation

---

## 2.4 Monthly Starting Balance

### Description

User sets:

- Monthly income OR
- Starting balance

The system subtracts expenses automatically.

### User Benefit

No need to manage complex category budgets.

### Design Principle

Avoid advanced budgeting systems in MVP.

---

## 2.5 Transaction List

### Description

Chronological list of expenses.

Each item displays:

- Amount
- Category
- Date
- Optional note

### Actions

- Edit
- Delete

### User Benefit

Simple overview without clutter.

---

## 2.6 Edit & Delete Transactions

### Edit

- User modifies amount, category, note, or date.
- Balance recalculates automatically.

### Delete

- Confirmation prompt before removal.
- Balance updates immediately.

### User Benefit

Mistakes can be corrected easily.

---

## 2.7 Basic Authentication (Optional)

### Description

Users can create an account using email and password.

### Technology

Supabase Auth.

### Purpose

- Sync data across sessions
- Protect user data

### Note

Guest/local mode may be supported later.

---

# 3. Post-MVP Features (Phase 2)

These features may be added if they align with simplicity.

---

## 3.1 CSV Export

### Description

Download all transactions as a CSV file.

### User Benefit

Data ownership and portability.

### Complexity

Low. Pure frontend export.

---

## 3.2 Category Customization

### Description

Allow users to:

- Add custom categories
- Edit or delete categories

### Constraint

Keep category system simple — no subcategories.

---

## 3.3 Monthly History View

### Description

View previous months’ totals and transaction lists.

### Design Rule

Simple month selector. No advanced comparisons.

---

## 3.4 Progressive Web App (PWA)

### Description

Installable web app experience.

### Benefit

Feels like a mobile app without building one.

---

# 4. Explicitly Excluded Features

To preserve simplicity, the following are not planned:

- Bank account syncing
- Credit card integrations
- Investment tracking
- Debt payoff planners
- Advanced financial analytics
- AI-based financial advice
- Category spending limits
- Multi-currency support (MVP)
- Recurring expense automation (MVP)
- Subscription tiers
- Ads

These introduce complexity and maintenance overhead.

---

# 5. Design Constraints for All Features

Every feature must:

1. Be understandable without explanation
2. Require minimal setup
3. Reduce friction in logging expenses
4. Avoid financial terminology
5. Keep the interface uncluttered
6. Be technically feasible without a custom backend

---

# 6. Technical Boundaries

Stack:

- React
- Tailwind CSS
- TypeScript
- Supabase
- Web Speech API

No:

- Node.js backend (MVP)
- Python services
- Paid APIs
- Heavy analytics libraries

---

# 7. Feature Prioritization Order

1. Monthly Dashboard
2. Manual Expense Entry
3. Monthly Balance Logic
4. Transaction Editing & Deleting
5. Authentication
6. Voice Entry
7. CSV Export
8. Category Customization
9. Monthly History

Features are added incrementally to prevent scope creep.

---

# 8. Success Criteria for Features

A feature is successful if:

- It makes tracking faster
- It improves clarity
- It does not increase interface complexity
- It does not require ongoing infrastructure maintenance
- It aligns with minimalist design

---

**Guiding Question:**

Does this feature help users quickly understand and manage their monthly spending?

If not, it should not be included.
