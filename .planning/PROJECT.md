# SimpleBudget

## What This Is

SimpleBudget is a minimalist, free, open-source web application for tracking monthly income and expenses. Built for individuals who want clarity over complexity — users can log expenses in seconds and instantly see their remaining monthly balance. No financial jargon, no feature bloat.

## Core Value

Users can log an expense and see their remaining balance in under 5 seconds. Everything else is secondary.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Monthly Dashboard showing income, expenses, and remaining balance
- [ ] Simple expense entry with amount, category, optional note, date
- [ ] Monthly starting balance (income or starting amount)
- [ ] Transaction list with edit and delete capabilities
- [ ] Authentication via Supabase (email/password)
- [ ] Voice-to-expense entry using Web Speech API
- [ ] Basic category system with predefined categories

### Out of Scope

- Bank account linking — complexity, privacy concerns
- Investment tracking — not a budgeting tool
- Advanced analytics or charts — adds cognitive load
- Multi-currency support — adds complexity for MVP
- Recurring automation — defer to future
- Mobile apps — PWA first
- Subscription tiers or paid features — always free
- AI-powered financial advice — aligns with simplicity goals

## Context

- Solo, part-time developer maintaining long-term
- Free-tier hosting (Vercel + Supabase)
- Privacy-conscious users who prefer manual tracking
- Web-first approach (no native mobile for MVP)
- Voice input for hands-free entry (browser-native only)

## Constraints

- **Tech Stack**: React + TypeScript + Tailwind CSS + Supabase — no custom backend
- **Voice**: Web Speech API only — no paid transcription services
- **Budget**: $0/month for MVP
- **Maintenance**: Must be sustainable for solo developer
- **Complexity**: Maximum 4 fields per form, no financial jargon

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No category spending limits | Adds complexity, MVP focuses on simple tracking | — Pending |
| Browser-native voice only | Free, no server costs, privacy-friendly | — Pending |
| Supabase for all backend | Zero DevOps, managed service, RLS security | — Pending |
| Single-page dashboard | Minimal cognitive load, instant balance visibility | — Pending |

---

*Last updated: 2026-05-12 after initialization*