# TECH_STACK.md

## Overview

This document outlines the technology choices for **SimpleBudget**. The primary goal is **simplicity, low maintenance, and zero infrastructure cost** for a solo, part-time developer. Every tool selected prioritizes ease of use and sustainability over raw power or complexity.

---

## 1. Frontend Architecture

### Core Framework

- **React.js (via Vite)**
  - _Why:_ Fast build times, component-based, massive ecosystem.
  - _Note:_ We use **Vite** instead of Create React App (CRA) for faster iteration and modern standards.

### Styling

- **Tailwind CSS**
  - _Why:_ Rapid UI development, utility-first approach ensures design consistency without writing custom CSS files.
  - _Benefit:_ Keeps bundle size small; easy to theme later.

### Type Safety

- **TypeScript**
  - _Why:_ Catches bugs early, improves code readability, and integrates seamlessly with Supabase types.
  - _Constraint:_ Slightly steeper learning curve, but saves debugging time long-term.

### State Management

- **Zustand (Global UI State) + React Query (Server State)**
  - _Zustand:_ For UI state (modals, theme, active tab). Lightweight alternative to Redux.
  - **TanStack Query (React Query):** For managing data fetching from Supabase (caching, revalidation, loading states).
  - _Avoid:_ Redux. It adds too much boilerplate for this scale.

### Forms

- **React Hook Form**
  - _Why:_ Low overhead, performant, easy validation handling.
  - _Alternative:_ Formik (too heavy), native HTML forms (too manual).

---

## 2. Backend & Data Layer

### Database & Auth

- **Supabase**
  - _Includes:_ PostgreSQL database, Authentication, Realtime subscriptions, Storage.
  - _Why:_ Open-source Firebase alternative. Managed service means **zero DevOps overhead**.
  - _Security:_ Row-Level Security (RLS) handles data privacy automatically.

### Server Logic

- **Supabase Edge Functions (Optional)**
  - _Use Case:_ Only if we need to call external APIs or do nightly calculations.
  - _Decision:_ Currently excluded. All logic remains client-side or uses Supabase Database Functions.

---

## 3. Voice Input Implementation

### Browser-Native API

- **Web Speech API (SpeechRecognition)**
  - _Platform:_ Chrome, Edge, Android (Desktop version).
  - _Constraint:_ Not natively supported in Safari/Firefox without polyfills or server processing.
  - _Strategy:_ Graceful degradation. If the API fails, show a fallback button to "Enable Microphone" or "Use Text Input."

### Audio Processing

- **None.** All transcription happens client-side.
- _Benefit:_ No audio upload costs, no privacy concerns with third-party servers, completely free.

---

## 4. Infrastructure & Deployment

### Hosting

- **Vercel** (Recommended) or **Netlify**
  - _Free Tier:_ Sufficient for initial launch and moderate traffic.
  - _CI/CD:_ Automatic deployments via Git pushes.

### Version Control

- **GitHub**
  - _Purpose:_ Code storage, issue tracking, collaboration.
  - _Actions:_ Automated testing/linting on push.

### Asset Delivery

- **Static CDN** (Included via Vercel/Netlify)
  - No need for AWS S3 or Cloudfront setup yet. Images/Screenshots served directly.

---

## 5. Developer Experience (DX) & Tooling

### Linting & Formatting

- **ESLint + Prettier**
  - _Why:_ Enforces consistent coding style automatically. Reduces review friction.

### Date Handling

- **date-fns**
  - _Why:_ Smaller footprint than Moment.js. Modern API.

### Icons

- **Lucide React**
  - _Why:_ Clean, lightweight SVG icon set. Easy to customize colors.

### Testing

- **Vitest / React Testing Library**
  - _Scope:_ Critical path testing only (Expense creation, Balance calculation).
  - _Avoid:_ E2E testing (Playwright/Cypress) for MVP. Too high maintenance for part-time work.

---

## 6. Excluded Technologies (Intentionally)

| Technology                 | Reason for Exclusion                                                              |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Node.js Express Server** | Supabase covers API needs. Adds deployment complexity.                            |
| **Python**                 | Unnecessary for budgeting logic. Added only for specific AI tasks (not in scope). |
| **PostgreSQL Self-Hosted** | Supabase manages backups/security.                                                |
| **AWS S3**                 | Supabase Storage handles image/file uploads.                                      |
| **GraphQL**                | REST/Supabase API is sufficient and simpler.                                      |
| **Redis**                  | Not required for real-time features in this MVP scope.                            |

---

## 7. Scalability Considerations

If the user base grows significantly:

1.  **Database:** Supabase Enterprise plans available easily.
2.  **Hosting:** Move to paid Vercel tier ($20/mo) if limits hit.
3.  **Voice:** Integrate Whisper API via Edge Function if browser API fails too often.
4.  **Mobile:** Wrap web app in Capacitor/Cordova later (PWA preferred first).

---

## 8. Cost Breakdown (Estimated Monthly)

| Service       | Plan          | Cost          |
| ------------- | ------------- | ------------- |
| React Hosting | Vercel Hobby  | $0            |
| Database/Auth | Supabase Free | $0            |
| Domain        | (Optional)    | ~$10/year     |
| **Total**     | **Initial**   | **~$0/month** |

---

## 9. Directory Structure (Proposed)

```bash
/src
  /components     # UI components (Button, Input, Card)
  /features       # Business logic (ExpenseEntry, Dashboard)
  /hooks          # Custom React hooks
  /lib            # Utility functions (money format, date)
  /supabase       # Supabase client setup
  /types          # TypeScript interfaces
  /styles         # Global Tailwind config
/public
/.env.local       # Environment variables
/package.json
/vite.config.ts
/tailwind.config.js
```
