# SimpleBudget – Project Overview

## 1. Vision

SimpleBudget is a minimalist, free, open-source web application for tracking monthly income and expenses.

The goal is clarity over complexity.

Users should be able to:

- Log expenses in seconds
- Instantly see their remaining monthly balance
- Build better money habits without financial jargon
- Use voice input for fast, hands-free entry

This project prioritizes simplicity, accessibility, and long-term sustainability for a solo, part-time developer.

---

## 2. Target Users

- Individuals managing personal monthly expenses
- Users who prefer simple tools over feature-heavy finance apps
- People building basic financial awareness
- Privacy-conscious users who prefer manual tracking over bank linking
- Users who want voice-based expense entry (free, no subscriptions)

---

## 3. Core Principles

- Minimal cognitive load
- No unnecessary features
- No ads
- No paid tiers
- No financial jargon
- Fast expense entry (under 5 seconds goal)
- Sustainable for solo development

---

## 4. MVP Features (Phase 1)

### 4.1 Single Monthly Dashboard

Displays:

- Monthly income or starting balance
- Total expenses
- Remaining balance
- Recent transactions list

Purpose: Immediate clarity on “How much do I have left?”

---

### 4.2 Simple Expense Entry

Fields:

- Amount
- Category (predefined list)
- Optional note
- Date (defaults to today)

Design goal: Maximum 3–4 fields to reduce friction.

---

### 4.3 Monthly Starting Balance

Users set:

- Monthly income OR starting balance

The system automatically subtracts expenses and calculates the remaining balance.

No complex category budgets in MVP.

---

### 4.4 Voice-to-Expense Entry (Free)

Implementation:

- Web Speech API (browser-native, Chromium-based browsers)
- No paid APIs
- No server-side audio processing

Workflow:

1. User taps microphone icon
2. Says: “Spent 20 dollars on groceries”
3. App extracts amount and category
4. Form is pre-filled
5. User confirms and saves

Voice entry assists the form — it does not auto-save.

---

### 4.5 Data & Storage

- Supabase (PostgreSQL + Auth)
- Simple schema (users, transactions, monthly settings)
- No bank integrations
- No third-party financial APIs

---

## 5. Out of Scope (MVP)

- Bank account linking
- Investment tracking
- Advanced analytics
- Complex charts
- Recurring automation
- Multi-currency support
- Native mobile apps
- Subscription tiers
- AI-powered financial insights

These may be explored later but are intentionally excluded to preserve simplicity.

---

## 6. Tech Stack

### Frontend

- React
- Tailwind CSS
- TypeScript

### Backend / Database

- Supabase (PostgreSQL + Authentication)

### Voice Transcription

- Web Speech API (browser-native)

### Deployment

- Vercel or Netlify (frontend)
- Supabase (backend)
- GitHub (version control)

No custom Node.js or Python backend required for MVP.

---

## 7. Architecture Overview

Frontend:
React → Supabase API → PostgreSQL

Voice Input:
Web Speech API → React → Supabase

No additional backend layer.

---

## 8. Sustainability Strategy

To ensure long-term maintainability:

- Keep database schema simple
- Avoid complex business logic
- Minimize dependencies
- Avoid paid APIs
- Build incrementally
- Reject feature bloat

Every feature must:

1. Provide clear user value
2. Require low maintenance
3. Align with minimalist design

---

## 9. Future Enhancements (Post-MVP)

- CSV export
- Category customization
- Basic monthly summary view
- Progressive Web App (PWA) support
- Simple visual trends (minimal charts)
- Data import

---

## 10. Definition of Success

The app succeeds if:

- Users can log an expense in under 5 seconds
- Users instantly see their remaining monthly balance
- The interface feels calm and uncluttered
- The project remains manageable for a solo developer
- Users build consistent tracking habits

---

## 11. Open Source Philosophy

SimpleBudget is:

- Free
- Open source
- Transparent
- Built for clarity and accessibility

Guiding question for every decision:

Does this make tracking money simpler — or more complicated?

If it adds complexity without clear benefit, it doesn’t belong.
