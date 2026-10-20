# SimpleBudget — Supabase Setup & Operations Guide

## Two-Project Model

Dev and production use **separate Supabase projects**. Never run schema changes against production
without testing on dev first.

| Environment | Supabase Project | Env File | Vercel Env |
|---|---|---|---|
| Local dev | Dev project | `.env.local` (copy from `.env.development.example`) | — |
| Production | Prod project | — | Vercel Dashboard → Settings → Environment Variables |

## Schema Application Order

Apply these scripts **in this exact order** via Supabase SQL Editor (or Supabase MCP):

1. `supabase/schema.sql` — creates tables, RLS policies, indexes
2. `supabase/schema-v2-categories.sql` — adds category_groups, categories tables, triggers, seeds
3. `supabase/rls-only.sql` — re-applies RLS (safe to re-run; idempotent-ish)

**Idempotency:** `schema-v2-categories.sql` has been fixed to guard the `ALTER TABLE ... ADD CONSTRAINT`
with an `IF NOT EXISTS` check so it can be re-run safely.

## Creating a Dev Branch (via Supabase MCP)

1. Call `create_branch` with name `dev` (requires cost confirmation — see MCP docs).
2. The branch gets its own `project_ref` — use it for local dev.
3. Apply schema scripts to the dev branch first.
4. Verify RLS policies with: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
5. Test with real user flows before promoting to production.

## Rollback Strategy

- **Schema changes:** Keep a backup of the previous schema. Supabase supports point-in-time recovery
  on Pro plans; on free tier, use `pg_dump` before major changes.
- **Data loss:** The `auth.users` table cascades deletes to `transactions`, `monthly_settings`,
  `categories`, and `category_groups`. Test cascades on dev first.
- **App rollback:** Revert the Git commit and re-deploy. Vercel keeps previous deployments.

## Vercel Environment Setup (Manual Steps)

1. Go to Vercel Dashboard → Project → Settings → Environment Variables.
2. Add `VITE_SUPABASE_URL` with your **production** project URL.
3. Add `VITE_SUPABASE_ANON_KEY` with your **production** anon key.
4. Set environment to "Production" (not Preview/Development).
5. Enable Deployment Protection:
   - GitHub repo → Settings → Environments → `production`
   - Add yourself as a Required Reviewer
   - This makes the `deploy` job in CI pause for approval.

## CI/CD Pipeline

```
push/PR to main → checkout → setup node → npm ci → tsc --noEmit → vitest run → npm audit (critical)
                                                                        ↓ (only if all pass + main push)
                                                                  deploy to Vercel (gated by
                                                                  vars.DEPLOY_ENABLED == 'true'
                                                                  and environment protection)
```

## Key Warnings

- ⚠️ NEVER run `schema.sql` or `rls-only.sql` against the production project directly.
- ⚠️ NEVER apply migrations without testing on a dev branch first.
- ⚠️ The `deploy` job is gated by `vars.DEPLOY_ENABLED == 'true'` — set this variable in
  GitHub repo settings (Settings → Secrets and variables → Actions → Variables) to enable deploys.
- ⚠️ Supabase free tier pauses projects after 7 days of inactivity. For a production app with
  real users, this should not be an issue, but monitor it.