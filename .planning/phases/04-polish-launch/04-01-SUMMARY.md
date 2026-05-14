---
phase: 04-polish-launch
plan: 01
type: execute
subsystem: infrastructure
tags: [error-boundary, ci-cd, vercel, deployment, testing]
requires: []
provides: [error-boundary, ci-pipeline, vercel-config]
affects: [src/main.tsx, .github/workflows/ci.yml]
tech-stack:
  added: [GitHub Actions, amondnet/vercel-action]
  patterns: [error-boundary class component, CI/CD with npm ci + tsc + vitest]
key-files:
  created:
    - src/components/ErrorBoundary.tsx
    - .github/workflows/ci.yml
    - vercel.json
    - .planning/phases/04-polish-launch/deferred-items.md
  modified:
    - src/main.tsx
    - .env.example
decisions:
  - "ErrorBoundary logs to console.error only — no external error reporting for MVP"
  - "CI/CD uses `npm ci` for reproducible builds, fails fast on type errors before tests"
  - "Vercel deploy guarded by github.ref == 'refs/heads/main' — PRs run quality checks only"
  - "VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID stored as GitHub Secrets, documented in PLAN frontmatter"
metrics:
  duration: 5m
  completed_date: 2026-05-14
  tasks_completed: 3
  files_created: 4
  files_modified: 2
  commits: 3
---

# Phase 4 Plan 1: Infrastructure Foundation — Summary

**One-liner:** Error boundary for crash safety, GitHub Actions CI/CD with tsc+vitest+Vercel auto-deploy, and explicit Vercel deployment configuration — enabling safe polish iterations during Phase 4.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ErrorBoundary component and wire into main.tsx | `a23c82b` | `src/components/ErrorBoundary.tsx`, `src/main.tsx` |
| 2 | Create GitHub Actions CI/CD workflow | `b7086a0` | `.github/workflows/ci.yml` |
| 3 | Create vercel.json and update .env.example | `769afaa` | `vercel.json`, `.env.example` |

## Deviations from Plan

### Deferred — Pre-existing TypeScript errors in Dashboard.tsx

- **Found during:** Task 3 verification
- **Issue:** Two unused variables (`isLoadingSettings`, `isLoadingTransactions`) in `src/features/Dashboard.tsx` from uncommitted prior work cause `tsc` (and thus `npm run build`) to fail
- **Action:** Logged to `deferred-items.md` — out of scope for this plan
- **Files affected:** `src/features/Dashboard.tsx` (not modified by this plan)
- **Expected resolution:** Plan 04-02 (a11y/polish) which already modifies Dashboard.tsx, or a dedicated follow-up

## Threat Flags

None — all security-relevant surfaces match the plan's threat model:
- T-04-01 mitigated: ErrorBoundary renders only generic fallback text, logs details to console only
- T-04-02 accepted: VERCEL_TOKEN has deployment-only scope, encrypted secret
- T-04-03 mitigated: npm ci enforces lockfile integrity
- T-04-04 transferred: Vercel token auth controls deploys

## Verification Results

| Check | Status | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | ❌ Fails | Pre-existing errors in `Dashboard.tsx` (unused variables from uncommitted Phase 3 changes) |
| `npx vitest run` | ✅ Passes | 16/16 tests pass |
| `npm run build` | ❌ Fails | `tsc` step fails due to same pre-existing Dashboard.tsx issues |
| File existence | ✅ Passes | All 5 expected files created/updated |

### Self-Check

- ✅ `src/components/ErrorBoundary.tsx` — exists, 62 lines (≥30), contains `class ErrorBoundary` and `componentDidCatch`
- ✅ `src/main.tsx` — contains `import { ErrorBoundary }` and `<ErrorBoundary>` wrapper
- ✅ `.github/workflows/ci.yml` — exists, contains `npx vitest run` and Vercel deploy step
- ✅ `vercel.json` — exists, contains `"framework"` field
- ✅ `.env.example` — exists, contains `VITE_SUPABASE_URL` with deployment notes

## User Setup Required

### GitHub Secrets (for CI/CD Vercel deploy)
1. Create Vercel access token: Vercel Dashboard → Settings → Tokens → Create Token
2. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as GitHub repository secrets:
   - GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret

### Vercel Environment Variables
1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Same values as local `.env` (D-25: single Supabase project for dev+prod)

## Key Technical Decisions

1. **Class component for ErrorBoundary** — Required because error boundaries must implement `componentDidCatch`, which only class components support
2. **`npm ci` in CI** — Enforces lockfile integrity; fails if `package-lock.json` doesn't match `package.json`
3. **`tsc` before `vitest`** — Fastest failure mode; type errors would surface in test compilation anyway
4. **Vercel deploy guarded by branch+event** — Only deploys on push to `main`, not on PRs (fork PRs still run quality checks)
