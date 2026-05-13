# USER_FLOW.md — SimpleBudget

## 1. Purpose of This Document

This document outlines how users move through SimpleBudget.

The goal is to ensure:

- Minimal cognitive load
- Fast expense entry (under 5 seconds)
- Clear visibility of remaining balance
- No unnecessary steps

Every flow prioritizes clarity and simplicity.

---

# 2. Core User Flows (MVP)

---

## Flow 1: First-Time User (Quick Start)

### Goal:

Allow a user to start tracking within minutes.

### Steps:

1. User opens the web app.
2. User chooses:
   - Continue without account (optional future)
   - Sign up / Log in (email + password)
3. User sets:
   - Monthly income OR starting balance
4. User lands on Monthly Dashboard.

### End State:

User sees:

- Total income
- Total expenses (initially 0)
- Remaining balance
- “Add Expense” button

### Design Notes:

- No onboarding tutorials.
- No multi-step wizard.
- One simple setup screen only.
- Default categories are preloaded.

---

## Flow 2: Manual Expense Entry (Primary Flow)

### Goal:

Log an expense in under 5 seconds.

### Steps:

1. User clicks “Add Expense”
2. Modal or inline form appears.
3. User enters:
   - Amount
   - Category (dropdown)
   - Optional note
   - Date (defaults to today)
4. User clicks “Save”

### System Behavior:

- Expense is saved to Supabase.
- Dashboard updates instantly.
- Remaining balance recalculates automatically.
- New transaction appears at top of list.

### End State:

User immediately sees updated remaining balance.

---

## Flow 3: Voice Expense Entry

### Goal:

Allow hands-free, fast entry.

### Steps:

1. User clicks microphone icon.
2. Browser requests microphone permission (first use).
3. User says:
   “Spent 20 dollars on groceries.”
4. Web Speech API converts speech to text.
5. System extracts:
   - Amount
   - Category (based on keyword match)
6. Form auto-fills.
7. User reviews and clicks “Save”.

### Important:

Voice does NOT auto-save.
User must confirm before saving.

### Edge Cases:

- If amount not detected → show editable form.
- If category unclear → default to “Other”.

### End State:

Expense saved and dashboard updates.

---

## Flow 4: Viewing Monthly Status

### Goal:

User instantly understands financial position.

### Dashboard Displays:

- Monthly income / starting balance
- Total expenses
- Remaining balance (visually emphasized)
- Recent transactions list

### User Actions Available:

- Add expense
- Delete expense
- Edit expense (optional in MVP or Phase 2)

No tabs. No charts. No secondary screens.

---

## Flow 5: Editing or Deleting an Expense

### Edit:

1. User clicks transaction.
2. Editable form appears.
3. User updates fields.
4. Save → balance recalculates.

### Delete:

1. User clicks delete icon.
2. Confirmation prompt appears.
3. Confirm → transaction removed.
4. Balance updates automatically.

Simple and reversible.

---

## Flow 6: Monthly Reset

### Goal:

Start a new month cleanly.

### Option A (Simplest MVP):

- System automatically detects new calendar month.
- New month starts with:
  - Same income (unless changed)
  - Empty expense list

Previous months remain viewable (optional Phase 2).

### Option B (Manual Reset):

- “Start New Month” button
- Archives previous data
- Clears transaction list

Keep this minimal to avoid complex history logic.

---

# 3. Navigation Structure

SimpleBudget uses a single-page structure:

Main View:

- Header (Month + Remaining Balance)
- Dashboard Summary
- Expense List
- Add Expense Button
- Microphone Icon

No sidebar navigation.
No multiple sections.
No complex menus.

---

# 4. Error Handling Flow

### If Voice Fails:

- Show transcript text.
- Allow manual correction.
- Do not block user.

### If Save Fails (Network Issue):

- Show lightweight error message.
- Allow retry.
- Do not erase typed data.

### If User Has No Income Set:

- Prompt: “Set your monthly balance to start tracking.”

---

# 5. Cognitive Load Rules

Every flow must follow:

- One primary action per screen
- No more than 4 inputs per form
- No financial terminology
- Immediate visual feedback
- No hidden calculations
- Remaining balance always visible

---

# 6. Non-Flows (Intentionally Excluded)

To preserve simplicity, the following are NOT part of MVP flows:

- Bank syncing
- Budget category limits
- Investment tracking
- Debt payoff tools
- Complex reporting
- Multi-account systems
- Gamification systems

---

# 7. Ideal User Experience Summary

A returning user should:

1. Open the app.
2. See remaining balance instantly.
3. Add expense in seconds (manual or voice).
4. Close the app.

No confusion.
No extra steps.
No learning curve.

---

# 8. Success Metric for User Flow

The flow is successful if:

- A new user can start tracking within 2 minutes.
- Logging an expense takes under 5 seconds.
- The remaining balance is always visible.
- Users never need instructions to navigate.

---

**Guiding UX Question:**

Can a non-technical person use this without explanation?

If not, simplify the flow.
