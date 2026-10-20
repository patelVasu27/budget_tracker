# SimpleBudget — Thin API Layer Design Document

**Status:** IMPLEMENTED — all API endpoints, RemoteStore v2, and auth migration complete.

**Context:** SimpleBudget currently accesses Supabase (Postgres + Auth + RLS) directly from the
browser. The anon key is public. RLS is the sole authorization boundary. This document proposes
adding a thin server-side API layer on Vercel (free Hobby tier) that enforces authorization in
TypeScript while keeping Supabase as the database and (optionally) auth provider.

---

## 1. Motivation

### What we gain
- **Server-side enforcement:** Authorization logic becomes TypeScript you can unit-test, not SQL
  policies you can only hope are correct.
- **No public anon key:** The Supabase service-role key stays server-side. The client never
  sees any Supabase credential.
- **Testable authorization:** Each endpoint's auth check is a function call with a unit test.
  Prompt 6 added RLS integration tests; this adds the complementary application-layer tests.
- **Rate limiting & validation:** Server-side input validation, request throttling, and
  structured error responses become possible.

### What we do NOT gain (be honest)
- **Not a security fix for a known vulnerability.** RLS is currently correct (verified via MCP
  in Prompt 3). This is defense-in-depth, not a patch.
- **Not simpler.** It adds ~16 endpoints, a session management layer, and a deployment
  dependency on Vercel serverless functions.
- **Not cheaper.** Vercel Hobby is free, but the added complexity costs developer time.

### Recommendation
**Defer until one of these triggers:**
1. The app reaches ~1,000 active users (RLS-only becomes a liability at scale).
2. A compliance or audit requirement demands server-side authorization proof.
3. The `DataStore` abstraction (Prompt 7) has been stable for 3+ months with no regressions.

Until then, the RLS + integration tests from Prompt 6 provide adequate security for a solo-maintained,
free-tier app.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                        │
│                                                             │
│  DataStore interface (Prompt 7)                              │
│    └── RemoteStore v2  ──fetch──►  /api/*  (Vercel)         │
│                                                             │
└────────────────────────────────────┬────────────────────────┘
                                     │ HTTPS (HTTP-only cookie)
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Serverless Functions (api/)                         │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ Auth verify  │  │ Input valid. │  │ Rate limiter      │ │
│  │ (JWT check)  │  │ (Zod)        │  │ (in-memory)       │ │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘ │
│         └────────────────┼────────────────────┘            │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase client (service-role key, server-side only) │   │
│  │  Postgres queries with WHERE user_id = verified_uid   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────┬────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (Postgres + Auth + RLS)                           │
│  RLS stays ENABLED as defense-in-depth                      │
└─────────────────────────────────────────────────────────────┘
```

### Key design decisions

1. **Keep Supabase Auth.** Do not build custom auth. The API verifies Supabase JWTs server-side
   and manages the session cookie. Password hashing, email verification, and password reset
   remain Supabase's responsibility.

2. **Keep RLS enabled.** The API connects with the service-role key (bypasses RLS) but applies
   `WHERE user_id = verified_uid` in every query. RLS remains as a second layer — if a bug
   in the API forgets the WHERE clause, RLS catches it.

3. **Use the DataStore seam.** The `DataStore` interface from Prompt 7 means `RemoteStore` can
   change its implementation from direct Supabase calls to `fetch('/api/...')` calls without
   touching any component or hook. This is the main reason the refactor is feasible.

4. **No new database tables.** The API uses the existing schema. No migrations needed.

---

## 3. Endpoint Specification

### Authentication

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| `POST` | `/api/auth/signup` | None | `{ email, password }` | `{ user: { id, email }, session: { access_token, refresh_token, expires_at } }` | 400 (validation), 409 (email exists), 500 |
| `POST` | `/api/auth/signin` | None | `{ email, password }` | `{ user: { id, email }, session: { access_token, refresh_token, expires_at } }` | 400 (validation), 401 (invalid credentials), 429 (rate limited), 500 |
| `POST` | `/api/auth/signout` | Cookie | — | `{ success: true }` | 401 |
| `GET` | `/api/auth/session` | Cookie | — | `{ user: { id, email }, session: { access_token, expires_at } }` or 401 | 401 (no session) |
| `POST` | `/api/auth/reset-password` | None | `{ email }` | `{ success: true }` (always, to prevent enumeration) | 400 (validation), 429, 500 |
| `POST` | `/api/auth/update-password` | Recovery token (in cookie or body) | `{ password }` | `{ success: true }` | 400 (validation), 401 (invalid/expired token), 500 |

### Transactions

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| `GET` | `/api/transactions?start=YYYY-MM-DD&end=YYYY-MM-DD&limit=N` | Cookie | Query params | `Transaction[]` | 400, 401, 500 |
| `POST` | `/api/transactions` | Cookie | `{ amount, type, category, categoryId, note, date }` | `Transaction` | 400 (validation), 401, 500 |
| `PUT` | `/api/transactions/:id` | Cookie | `{ amount, type, category, categoryId, note, date }` | `Transaction` | 400, 401, 404 (not found / not owned), 500 |
| `DELETE` | `/api/transactions/:id` | Cookie | — | `{ success: true }` | 401, 404, 500 |

### Monthly Settings

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| `GET` | `/api/monthly-settings?month=N&year=N` | Cookie | Query params | `MonthlySettings \| null` | 400, 401, 500 |
| `PUT` | `/api/monthly-settings` | Cookie | `{ income, month, year }` | `MonthlySettings` | 400, 401, 500 |

### Categories

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| `GET` | `/api/categories` | Cookie | — | `Category[]` | 401, 500 |
| `POST` | `/api/categories` | Cookie | `{ name, type, group_id, icon, color }` | `Category` | 400, 401, 409 (duplicate name), 500 |
| `PUT` | `/api/categories/:id` | Cookie | `{ name, type, group_id, icon, color }` | `Category` | 400, 401, 404, 500 |
| `DELETE` | `/api/categories/:id` | Cookie | — | `{ success: true }` | 401, 404, 500 |
| `PUT` | `/api/categories/reorder` | Cookie | `{ ordered: [{ id, sort_order }] }` | `{ success: true }` | 400, 401, 500 |

### Category Groups

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| `GET` | `/api/category-groups` | Cookie | — | `CategoryGroup[]` | 401, 500 |
| `POST` | `/api/category-groups` | Cookie | `{ name }` | `CategoryGroup` | 400, 401, 409 (duplicate name), 500 |
| `PUT` | `/api/category-groups/:id` | Cookie | `{ name }` | `CategoryGroup` | 400, 401, 404, 500 |
| `DELETE` | `/api/category-groups/:id` | Cookie | — | `{ success: true }` | 401, 404, 500 |

**Total: 17 endpoints across 6 resource groups.**

---

## 4. Authentication & Session Management

### Session flow

1. **Sign in:** Client sends `POST /api/auth/signin { email, password }`.
   Server calls Supabase GoTrue `POST /auth/v1/token?grant_type=password`.
   On success, server sets an HTTP-only, Secure, SameSite=Lax cookie:
   ```
   Set-Cookie: sb-session=<access_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
   ```
   Server also stores the refresh token in a separate cookie:
   ```
   Set-Cookie: sb-refresh=<refresh_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
   ```

2. **Subsequent requests:** Client sends cookie automatically. Server reads `sb-session`,
   verifies the JWT signature against Supabase's JWKS endpoint (cached, refreshed hourly).
   Extracts `sub` (user_id) from the verified JWT payload. This is the **only** source of
   user identity — never from request body, query params, or headers.

3. **Token refresh:** Supabase access tokens expire after 1 hour. When the server detects an
   expired token (JWT `exp` claim), it uses the `sb-refresh` cookie to call GoTrue's
   refresh endpoint. On success, it sets a new `sb-session` cookie. If refresh fails
   (expired/revoked), server returns 401 and client redirects to login.

4. **Sign out:** Client sends `POST /api/auth/signout`. Server clears both cookies
   (`Max-Age=0`) and calls GoTrue's logout endpoint.

5. **Session check:** Client sends `GET /api/auth/session` on app boot. Server verifies
   the cookie JWT and returns `{ user, session }` or 401. This replaces the current
   `supabase.auth.getSession()` + `onAuthStateChange()` pattern.

### What happens when the token expires mid-session?

- The client's next API call returns 401.
- The client's `RemoteStore` (or a fetch wrapper) detects 401 and calls
  `GET /api/auth/session` to attempt a refresh.
- If refresh succeeds, retry the original request.
- If refresh fails, clear local state and redirect to login.
- This is handled in a single fetch wrapper, not scattered across components.

### Security properties of the cookie

| Property | Value | Why |
|---|---|---|
| `HttpOnly` | Yes | Prevents XSS from stealing the token |
| `Secure` | Yes | Only sent over HTTPS |
| `SameSite` | `Lax` | Prevents CSRF while allowing top-level navigation |
| `Path` | `/` | Available to all API routes |
| `Max-Age` | 3600 (access), 604800 (refresh) | Matches Supabase token expiry |

---

## 5. Authorization Enforcement

### The rule

> **Every handler derives `user_id` from the verified JWT. Never from the request.**

```typescript
// api/_lib/auth.ts (shared middleware)
export async function verifyAuth(req: VercelRequest): Promise<{ userId: string } | null> {
  const token = req.cookies['sb-session']
  if (!token) return null

  // Verify JWT signature against Supabase JWKS
  const payload = await verifyJwt(token, SUPABASE_JWKS_URL)
  if (!payload || !payload.sub) return null

  // Check expiry
  if (payload.exp && payload.exp < Date.now() / 1000) {
    // Attempt refresh using sb-refresh cookie
    const refreshed = await refreshToken(req.cookies['sb-refresh'])
    if (!refreshed) return null
    // Set new cookie on response (handled by caller)
    return { userId: refreshed.sub, newToken: refreshed.access_token }
  }

  return { userId: payload.sub }
}
```

### Per-endpoint authorization pattern

```typescript
// api/transactions/[id].ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req)
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const userId = auth.userId  // ONLY source of identity

  if (req.method === 'PUT') {
    // Update: WHERE id = $1 AND user_id = $2
    const result = await db.query(
      'UPDATE transactions SET ... WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(result.rows[0])
  }

  if (req.method === 'DELETE') {
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ success: true })
  }
}
```

### Defense in depth

1. **Application layer:** `WHERE user_id = verified_uid` in every query.
2. **Database layer:** RLS policies remain enabled (`auth.uid() = user_id`).
3. **The API connects with the service-role key** (bypasses RLS), so RLS is a backstop,
   not the primary gate. If a query forgets the WHERE clause, RLS catches it.

### Input validation

All request bodies validated with Zod schemas before reaching the database:

```typescript
const CreateTransactionSchema = z.object({
  amount: z.number().min(0),
  type: z.enum(['expense', 'income']),
  category: z.string().min(1).max(32),
  categoryId: z.string().uuid().nullable(),
  note: z.string().max(500).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```

---

## 6. RLS Relationship

| Layer | Role | Status |
|---|---|---|
| RLS policies | Defense-in-depth backstop | **Stays enabled** |
| API authorization | Primary gate (TypeScript, testable) | **New** |
| Client-side DataStore | UI convenience (no security role) | **Unchanged** |

RLS is NOT removed. The API connects with the service-role key (bypasses RLS), but every query
includes `WHERE user_id = verified_uid`. If a bug in the API omits this filter, RLS catches it
because the service-role connection still has RLS enabled and the policy checks `auth.uid()`.

Wait — the service role bypasses RLS by default. So RLS would NOT catch a missing WHERE clause
when using the service role. This is a known limitation.

**Mitigation:** The API should use a non-service-role connection (authenticated as the user) so
RLS is active. But this requires passing the user's JWT to Postgres, which Supabase supports via
`SET LOCAL request.jwt.claim.sub`. This is how Supabase's own PostgREST works.

**Decision:** Use the user's JWT for DB connections (RLS active) AND apply `WHERE user_id` in
application code. This gives true defense-in-depth: both layers must fail for a breach.

---

## 7. Migration Strategy

### Principle: Reversible at every step

The `DataStore` interface (Prompt 7) provides the seam. Migration happens in `RemoteStore` only.

### Step 1: Implement API endpoints (no client changes)

Create all 17 endpoints in `api/`. Each handler:
- Verifies auth via shared middleware
- Validates input with Zod
- Queries Supabase (user JWT for RLS + WHERE user_id)
- Returns JSON

**Verification:** Unit tests for each handler (mocked DB). Integration tests against a dev DB.

### Step 2: Implement RemoteStore v2 (feature-flagged)

Create `RemoteStoreV2` that calls `/api/*` instead of Supabase directly. Keep `RemoteStore` (v1)
as fallback.

```typescript
// src/stores/remoteStore.ts
export class RemoteStore implements DataStore {
  constructor(private userId: string, private useApi: boolean = false) {}
  // ... methods check this.useApi and route accordingly
}
```

Feature flag: `VITE_USE_API_LAYER=true` in `.env.local`. Default: `false`.

### Step 3: Migrate one resource at a time

Order: transactions → monthly_settings → categories → category_groups → auth.

For each resource:
1. Enable API for that resource in `RemoteStore`.
2. Test manually (all CRUD operations).
3. Run integration tests.
4. If any failure, revert the flag for that resource.
5. Once stable, remove the v1 code path for that resource.

### Step 4: Migrate auth

This is the riskiest step. Auth touches `authStore.ts`, `App.tsx`, and `AuthModal.tsx`.

Strategy:
1. Implement auth endpoints first (signup, signin, signout, session, reset, update-password).
2. Update `authStore.ts` to use `/api/auth/*` instead of `supabase.auth.*`.
3. Update `App.tsx` to call `GET /api/auth/session` on boot instead of `supabase.auth.getSession()`.
4. Keep Supabase Auth as the backend (API proxies to GoTrue).

### Step 5: Remove Supabase client from browser

Once all resources are migrated and stable for 2+ weeks:
1. Remove `@supabase/supabase-js` from `package.json`.
2. Remove `src/lib/supabase.ts`.
3. Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.
4. Keep Supabase env vars server-side only (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### Rollback

At every step, the feature flag can be flipped to `false` to revert to direct Supabase access.
The v1 code path remains until Step 5.

---

## 8. Testing Strategy

### Unit tests (per handler)

Each API handler gets a unit test with a mocked database:

```typescript
// api/transactions/[id].test.ts
describe('DELETE /api/transactions/:id', () => {
  it('returns 401 without auth cookie', async () => { ... })
  it('returns 404 for another user\'s transaction', async () => { ... })
  it('deletes own transaction and returns 200', async () => { ... })
  it('returns 400 for invalid UUID', async () => { ... })
})
```

### Authorization tests (the payoff)

The key tests that this architecture enables:

```typescript
describe('Authorization enforcement', () => {
  it('user A cannot read user B transactions', async () => { ... })
  it('user A cannot update user B transaction (returns 404, not 403)', async () => { ... })
  it('user A cannot delete user B transaction (returns 404)', async () => { ... })
  it('user A cannot create transaction with user_id = user B', async () => { ... })
  it('expired token returns 401', async () => { ... })
  it('tampered JWT returns 401', async () => { ... })
})
```

Note: returning 404 (not 403) for unauthorized access prevents user enumeration (attacker can't
distinguish "doesn't exist" from "exists but not yours").

### Integration tests

Extend the existing `test:integration` suite (Prompt 6) to test through the API layer:
- Start a local Vercel dev server (`vercel dev`)
- Run the same RLS isolation tests but through `/api/*` endpoints instead of direct DB
- Verify that the API correctly enforces authorization

---

## 9. Cost Analysis (Vercel Hobby — Free Tier)

| Resource | Hobby Limit | Estimated Usage | Headroom |
|---|---|---|---|
| Serverless function invocations | 100 GB-hours/month | ~0.5 GB-hours (low traffic) | 99.5% |
| Bandwidth | 100 GB/month | ~1 GB/month | 99% |
| Build minutes | 6000 min/month | ~5 min/deploy | 99.9% |
| Edge middleware | 1M invocations/month | ~10K/month | 99% |
| Environment variables | Unlimited | 5 vars | N/A |

**Conclusion:** The API layer fits comfortably within Vercel Hobby free tier. No cost increase.

**Risk:** Vercel Hobby has a 10-second function timeout. All endpoints are simple CRUD queries
that complete in <100ms. No risk of timeout. If complex queries are added later, they should be
optimized or moved to Supabase RPC functions.

---

## 10. Effort Estimate

| Phase | Effort | Risk |
|---|---|---|
| 1. Implement 17 endpoints + shared auth middleware | 2-3 days | Medium (auth session management) |
| 2. Implement RemoteStore v2 (API client) | 1 day | Low (follows DataStore interface) |
| 3. Migrate + test transactions resource | 0.5 day | Low |
| 4. Migrate + test remaining resources | 1 day | Low |
| 5. Migrate auth (signin, signup, session, reset) | 1-2 days | **High** (session management, token refresh) |
| 6. Remove Supabase client from browser | 0.5 day | Low (cleanup) |
| 7. Testing (unit + integration + manual) | 1-2 days | Medium |
| **Total** | **7-10 days** | |

### Is it worth it?

**For a solo maintainer at this stage: No.** Here's why:

1. **RLS is already correct.** Verified via MCP (Prompt 3). 16 policies, all matching SQL files,
   no drift. The security gap this closes is theoretical, not actual.
2. **Integration tests exist.** Prompt 6 added 22 tests that prove isolation. If a policy breaks,
   CI catches it.
3. **The complexity cost is high.** 17 endpoints, session management, token refresh, CORS, cookie
   handling — all new code that needs maintenance, testing, and debugging.
4. **The benefit is marginal at current scale.** Defense-in-depth matters more at 10,000+ users
   with compliance requirements. At <1,000 users with no compliance needs, RLS + tests suffice.

**When to reconsider:**
- User count exceeds 1,000 active users
- A security audit or compliance requirement demands server-side authorization proof
- The `DataStore` abstraction has been stable for 3+ months
- You have a second developer to review the API code

**If you do proceed:** Start with the transactions resource only. Run it in parallel with the
existing direct-Supabase path (feature flag). Only migrate auth last. Never do a big-bang cutover.

---

## 11. File Structure (if implemented)

```
api/
  _lib/
    auth.ts          # verifyAuth(), refreshToken(), setSessionCookie()
    db.ts            # Supabase client (service role, server-side only)
    validate.ts      # Zod schemas for all endpoints
    errors.ts        # Standardized error responses
  auth/
    signup.ts
    signin.ts
    signout.ts
    session.ts
    reset-password.ts
    update-password.ts
  transactions/
    index.ts         # GET (list), POST (create)
    [id].ts          # PUT (update), DELETE
  monthly-settings/
    index.ts         # GET, PUT
  categories/
    index.ts         # GET, POST
    [id].ts          # PUT, DELETE
    reorder.ts       # PUT (batch reorder)
  category-groups/
    index.ts         # GET, POST
    [id].ts          # PUT, DELETE
```

### Environment variables (server-side only, never in client bundle)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (NEVER expose to client)
```

### Removed from client bundle

```
VITE_SUPABASE_URL       → removed
VITE_SUPABASE_ANON_KEY  → removed
```

---

## 12. Open Questions (for approval)

1. **Should Supabase Auth be replaced entirely?** This design keeps Supabase Auth as the backend.
   An alternative is to build custom auth (bcrypt + JWT) in the API. That's more work and more risk.
   Recommendation: keep Supabase Auth.

2. **Should the API use the service role (bypass RLS) or user JWT (RLS active)?** This design uses
   the user JWT so RLS remains active. The tradeoff is that every request must verify the JWT and
   pass it to Postgres. Recommendation: user JWT (true defense-in-depth).

3. **Should rate limiting be in-memory or Redis?** Vercel serverless functions are stateless —
   in-memory rate limiting resets on cold start. For a solo dev, in-memory is fine. For production
   at scale, use Vercel's built-in rate limiting or Upstash Redis (free tier). Recommendation:
   in-memory for now, Upstash if needed later.

4. **Should the API be in `api/` (Vercel functions) or a separate service?** `api/` is simplest
   and deploys with the app. A separate service (e.g., on Railway/Fly) adds complexity. Recommendation:
   `api/` (Vercel functions).

---

*This document is design-only. No code has been written. No files have been modified beyond this
document. Awaiting approval before implementation.*