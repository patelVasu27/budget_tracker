# SimpleBudget — Baseline Report

Generated during Prompt 1 (Preflight & Baseline). Read-only measurement pass — no code changes made.

## Environment

| Item | Value |
|---|---|
| Date | Tue Oct 20 2026 |
| Branch | `fix/security-quick-wins` |
| Commit SHA | `fb084f01135c3f377c3c52c8c352bf44cd5cb51c` |
| Node | 20 |
| Platform | win32 (Windows) |

## Git State

- Working tree: `vercel.json` shows as modified but diff is **empty except a CRLF line-ending warning** (false positive — no actual content change).
- Untracked: `PROMPTS.md` (execution prompt document, not yet committed).
- No secrets committed. Tracked secret-related files: `.env.example`, `src/vite-env.d.ts` only.

## Measurements

### 1. TypeScript Check (`npx tsc --noEmit`)

**PASS** — zero errors.

### 2. Unit Tests (`npx vitest run`)

| Metric | Value |
|---|---|
| Test files | 2 passed |
| Tests | 21 passed |
| Duration | 21.40s |

Test files: `src/hooks/useAmountParser.test.ts`, `src/lib/categoryMatcher.test.ts`.
No integration tests exist yet.

### 3. Production Build (`npm run build`)

| Asset | Raw | Gzip |
|---|---|---|
| `dist/assets/index-<hash>.js` | 845.72 kB | 255.63 kB |
| `dist/assets/index-<hash>.css` | 45.54 kB | 7.85 kB |
| `dist/index.html` | 0.88 kB | 0.43 kB |
| Build time | 10.00s | |
| Chunks | 1 JS chunk, 1 CSS chunk | No code splitting |

**Note:** Bundle grew slightly vs. earlier measurement (821.79 → 845.72 kB raw) due to the v3.0 "Budget Pulse" redesign commit (`fb084f0`). The "5 second" promise is still broken by bundle size alone.

### 4. Dependency Audit (`npm audit`)

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 21 |
| Moderate | 5 |
| Low | 1 |
| **Total** | **27** |

**Unfixable finding:** `xlsx@0.18.5` — HIGH severity, `fixAvailable: false`.
- GHSA-4r6h-8v6p-xvw6 (Prototype Pollution, CVSS 7.8, <0.19.3)
- GHSA-5pgg-2g8v-p4x9 (ReDoS, CVSS 7.5, <0.20.2)
- Advisory: "Patched versions: None. The npm package `xlsx` is no longer maintained."
- Note: app only WRITES spreadsheets (not reads), so the prototype-pollution path is not currently reachable. But the package is permanently dead.

Remaining 20 high vulnerabilities are in dev-only dependencies (eslint chain, vite, postcss, vitest).

### 5. Secret Leak Check (`git ls-files`)

**PASS** — no secrets tracked. Only `.env.example` and `src/vite-env.d.ts`.

### 6. Image Bloat

| File | Dimensions | Size | MD5 (prefix) |
|---|---|---|---|
| `public/favicon.png` | 1408×768 | 1561.4 KB | `6AC55503F3F7` |
| `public/logo.png` | 1017×1017 | 389.0 KB | `4529EDF5B553` |

**Note:** Images are **no longer byte-identical** (changed in v3.0 redesign commit `fb084f0`). The logo was resized to 1017×1017 (389 KB) but the favicon is still the old 1408×768 (1561.4 KB). The favicon is still ~4x larger than it needs to be for a 32×32 display.

### 7. Security Headers

| Check | Result |
|---|---|
| `vercel.json` has `headers` block | **MISSING** |
| `index.html` has CSP meta tag | **MISSING** |
| Clickjacking protection | **NONE** |

### 8. Supabase MCP Status

- **Connected** — can inspect live tables, RLS policies, indexes, migrations, and create dev branches.
- RLS confirmed enabled on all 4 tables by owner (not yet verified via MCP — will do in Prompt 3/6).

## Pre-Existing Issues Found (NOT fixed — recorded for future phases)

1. **Bundle size:** 845.72 kB raw / 255.63 kB gzip in a single chunk. No code splitting.
2. **Unpatchable dependency:** `xlsx@0.18.5` with HIGH CVE, `fixAvailable: false`.
3. **No security headers:** No CSP, no frame-ancestors, no X-Frame-Options. Clickjacking possible.
4. **Image bloat:** `favicon.png` is 1408×768, 1561 KB — displayed at 32×32.
5. **27 npm vulnerabilities:** 21 high (mostly dev-only, except xlsx).
6. **No integration tests:** Only 2 unit test files (21 tests, all pure functions).
7. **No password reset flow:** AuthModal has signIn/signUp only.
8. **No month navigation:** App locked to current calendar month.
9. **Float money math:** JS float addition for balance calculation.
10. **Silent query failures:** `{ data }` destructured, `error` discarded.
11. **Console PII:** Voice transcripts logged in plaintext (Dashboard.tsx:246).
12. **Dev/prod share one Supabase project:** Single project for dev and production.
13. **CI auto-deploys to prod on every push to main.**

## Next Steps

Proceed to Prompt 2 (Security Headers) or Prompt 3 (Authorization Hardening) per the execution order in `PROMPTS.md`.