# CLAUDE.md — SimpleBudget Development Guide

## Project Context

SimpleBudget is a minimalist, free, open-source web application for tracking monthly income and expenses. Core value: Users can log an expense and see their remaining balance in under 5 seconds.

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Supabase (PostgreSQL + Auth)
- Voice: Web Speech API (browser-native)
- Hosting: Vercel

## Key Principles

1. **Simplicity first** — No financial jargon, max 4 fields per form
2. **Minimal cognitive load** — Single-page dashboard, instant balance visibility
3. **Sustainable for solo dev** — No complex infrastructure, $0/month budget
4. **Voice entry** — Browser-native only, no paid APIs

## Design Rules

- No charts or complex visualizations in MVP
- No sidebar navigation or multiple sections
- Remaining balance always visible
- Maximum 4 inputs per form
- No auto-save for voice entries (user must confirm)

## Architecture

- React components in `src/components/` and `src/features/`
- Supabase client in `src/lib/supabase.ts`
- TypeScript interfaces in `src/types/`
- Custom hooks in `src/hooks/`
- Zustand for UI state, React Query for server state

## Dependencies

- `zustand` — Global UI state
- `@tanstack/react-query` — Server state
- `react-hook-form` — Form handling
- `date-fns` — Date utilities
- `lucide-react` — Icons
- `@supabase/supabase-js` — Database client

## Current Phase

Phase 0 (Not started). Run `/gsd-plan-phase 1` to begin Phase 1: Foundation & Dashboard.

## Key Files

- `.planning/PROJECT.md` — Project context and requirements
- `.planning/ROADMAP.md` — Phase structure
- `.planning/REQUIREMENTS.md` — Detailed requirements with REQ-IDs
- `CLAUDE.md` — This file

---
*Last updated: 2026-05-12 after initialization*