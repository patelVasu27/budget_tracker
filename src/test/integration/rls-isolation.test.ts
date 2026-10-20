import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Set TEST_DATABASE_URL to a disposable Postgres instance to run these tests.
// Example: TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/testdb
// If unset, all tests in this file are skipped with a clear message.
// NEVER point this at a production database.

const TEST_DB_URL = process.env.TEST_DATABASE_URL

// ---------------------------------------------------------------------------
// Skip guard
// ---------------------------------------------------------------------------
const describeIf = TEST_DB_URL ? describe : describe.skip

if (!TEST_DB_URL) {
  console.warn(
    '\n⚠️  INTEGRATION TESTS SKIPPED: TEST_DATABASE_URL is not set.\n' +
    '   To run: set TEST_DATABASE_URL to a disposable Postgres instance.\n' +
    '   Example: TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/testdb npx vitest run src/test/integration\n' +
    '   See docs/SUPABASE.md for full setup instructions.\n'
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const pool = TEST_DB_URL ? new Pool({ connectionString: TEST_DB_URL }) : null

async function query(text: string, params?: unknown[]) {
  if (!pool) throw new Error('No database connection')
  return pool.query(text, params)
}

// Simulate a specific user by setting the JWT claim sub
async function asUser(client: { query: (text: string, params?: unknown[]) => Promise<unknown> }, userId: string) {
  await client.query(`SET LOCAL role = 'authenticated'`)
  await client.query(`SET LOCAL "request.jwt.claim.sub" = '${userId}'`)
  await client.query(`SET LOCAL "request.jwt.claims" = '{"sub":"${userId}","role":"authenticated"}'`)
}

async function asAnon(client: { query: (text: string, params?: unknown[]) => Promise<unknown> }) {
  await client.query(`SET LOCAL role = 'anon'`)
  await client.query(`SET LOCAL "request.jwt.claim.sub" = ''`)
}

// ---------------------------------------------------------------------------
// Test users
// ---------------------------------------------------------------------------
const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

// ---------------------------------------------------------------------------
// Setup & Teardown
// ---------------------------------------------------------------------------
describeIf('RLS Cross-User Isolation', () => {
  beforeAll(async () => {
    if (!pool) return

    // 1. Create auth schema shim
    await query(`
      CREATE SCHEMA IF NOT EXISTS auth;
    `)

    // auth.users table (minimal)
    await query(`
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT,
        encrypted_password TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // auth.uid() function — reads from session variable
    await query(`
      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS UUID AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
      $$ LANGUAGE sql STABLE;
    `)

    // auth.role() function
    await query(`
      CREATE OR REPLACE FUNCTION auth.role()
      RETURNS TEXT AS $$
        SELECT COALESCE(current_setting('request.jwt.claim.role', true), 'anon');
      $$ LANGUAGE sql STABLE;
    `)

    // 2. Read and apply schema SQL files
    const schemaDir = path.resolve(__dirname, '../../../supabase')
    const schemaSql = fs.readFileSync(path.join(schemaDir, 'schema.sql'), 'utf-8')
    const schemaV2Sql = fs.readFileSync(path.join(schemaDir, 'schema-v2-categories.sql'), 'utf-8')

    // Apply schema.sql (tables, RLS, indexes)
    await query(schemaSql)

    // Apply schema-v2-categories.sql (categories, category_groups, trigger)
    // Note: this file contains DO blocks and triggers — apply as-is
    await query(schemaV2Sql)

    // 3. Create test users
    await query(`INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [USER_A, 'usera@test.com'])
    await query(`INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [USER_B, 'userb@test.com'])

    // Trigger should have seeded categories for both users
  }, 30000)

  afterAll(async () => {
    if (!pool) return
    // Clean up test data
    await query(`DELETE FROM public.transactions WHERE user_id IN ($1, $2)`, [USER_A, USER_B])
    await query(`DELETE FROM public.monthly_settings WHERE user_id IN ($1, $2)`, [USER_A, USER_B])
    await query(`DELETE FROM public.categories WHERE user_id IN ($1, $2)`, [USER_A, USER_B])
    await query(`DELETE FROM public.category_groups WHERE user_id IN ($1, $2)`, [USER_A, USER_B])
    await query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [USER_A, USER_B])
    await pool.end()
  }, 30000)

  // ---------------------------------------------------------------------------
  // Helper: insert test data as a specific user
  // ---------------------------------------------------------------------------
  async function insertTransaction(userId: string, amount: number, note: string) {
    const client = await pool!.connect()
    try {
      await client.query('BEGIN')
      await asUser(client, userId)
      const result = await client.query(
        `INSERT INTO public.transactions (user_id, amount, type, category, note, date)
         VALUES ($1, $2, 'expense', 'Food', $3, '2026-01-15')
         RETURNING id`,
        [userId, amount, note]
      )
      await client.query('COMMIT')
      return result.rows[0].id as string
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  async function insertMonthlySettings(userId: string, income: number) {
    const client = await pool!.connect()
    try {
      await client.query('BEGIN')
      await asUser(client, userId)
      const result = await client.query(
        `INSERT INTO public.monthly_settings (user_id, income, month, year)
         VALUES ($1, $2, 1, 2026)
         RETURNING id`,
        [userId, income]
      )
      await client.query('COMMIT')
      return result.rows[0].id as string
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  // ---------------------------------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------------------------------
  describe('transactions', () => {
    let txB: string

    beforeAll(async () => {
      await insertTransaction(USER_A, 100, 'User A transaction')
      txB = await insertTransaction(USER_B, 200, 'User B transaction')
    })

    it('User A can read their own transactions', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.transactions')
        await client.query('COMMIT')
        expect(result.rows.length).toBe(1)
        expect(result.rows[0].note).toBe('User A transaction')
      } finally {
        client.release()
      }
    })

    it('User A CANNOT read User B transactions', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.transactions WHERE id = $1', [txB])
        await client.query('COMMIT')
        expect(result.rows.length).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT insert a transaction with user_id = User B', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        await expect(
          client.query(
            `INSERT INTO public.transactions (user_id, amount, type, category, note, date)
             VALUES ($1, 50, 'expense', 'Food', 'injected', '2026-01-15')`,
            [USER_B]
          )
        ).rejects.toThrow()
        await client.query('ROLLBACK')
      } finally {
        client.release()
      }
    })

    it('User A CANNOT update User B transaction', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `UPDATE public.transactions SET note = 'hacked' WHERE id = $1`,
          [txB]
        )
        await client.query('COMMIT')
        // RLS filters the row, so 0 rows affected
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT delete User B transaction', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `DELETE FROM public.transactions WHERE id = $1`,
          [txB]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })

    it('Anonymous user can read NOTHING', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asAnon(client)
        const result = await client.query('SELECT * FROM public.transactions')
        await client.query('COMMIT')
        expect(result.rows.length).toBe(0)
      } finally {
        client.release()
      }
    })
  })

  // ---------------------------------------------------------------------------
  // MONTHLY_SETTINGS
  // ---------------------------------------------------------------------------
  describe('monthly_settings', () => {
    let msB: string

    beforeAll(async () => {
      await insertMonthlySettings(USER_A, 5000)
      msB = await insertMonthlySettings(USER_B, 3000)
    })

    it('User A can read their own monthly settings', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.monthly_settings')
        await client.query('COMMIT')
        expect(result.rows.length).toBe(1)
        expect(Number(result.rows[0].income)).toBe(5000)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT read User B monthly settings', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.monthly_settings WHERE id = $1', [msB])
        await client.query('COMMIT')
        expect(result.rows.length).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT insert monthly settings for User B', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        await expect(
          client.query(
            `INSERT INTO public.monthly_settings (user_id, income, month, year) VALUES ($1, 9999, 2, 2026)`,
            [USER_B]
          )
        ).rejects.toThrow()
        await client.query('ROLLBACK')
      } finally {
        client.release()
      }
    })

    it('User A CANNOT update User B monthly settings', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `UPDATE public.monthly_settings SET income = 9999 WHERE id = $1`,
          [msB]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT delete User B monthly settings', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `DELETE FROM public.monthly_settings WHERE id = $1`,
          [msB]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })
  })

  // ---------------------------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------------------------
  describe('categories', () => {
    it('seeding trigger created default categories for both users', async () => {
      const clientA = await pool!.connect()
      try {
        await clientA.query('BEGIN')
        await asUser(clientA, USER_A)
        const result = await clientA.query('SELECT * FROM public.categories')
        await clientA.query('COMMIT')
        // Should have at least the 7 default expense + 2 income categories
        expect(result.rows.length).toBeGreaterThanOrEqual(9)
      } finally {
        clientA.release()
      }

      const clientB = await pool!.connect()
      try {
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const result = await clientB.query('SELECT * FROM public.categories')
        await clientB.query('COMMIT')
        expect(result.rows.length).toBeGreaterThanOrEqual(9)
      } finally {
        clientB.release()
      }
    })

    it('User A can read their own categories', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.categories')
        await client.query('COMMIT')
        expect(result.rows.length).toBeGreaterThan(0)
        // All rows belong to User A
        for (const row of result.rows) {
          expect(row.user_id).toBe(USER_A)
        }
      } finally {
        client.release()
      }
    })

    it('User A CANNOT read User B categories', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        // Get User B's category IDs first (as User B)
        const clientB = await pool!.connect()
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const bCats = await clientB.query('SELECT id FROM public.categories LIMIT 1')
        await clientB.query('COMMIT')
        clientB.release()

        if (bCats.rows.length > 0) {
          const result = await client.query('SELECT * FROM public.categories WHERE id = $1', [bCats.rows[0].id])
          await client.query('COMMIT')
          expect(result.rows.length).toBe(0)
        }
      } finally {
        client.release()
      }
    })

    it('User A CANNOT insert a category for User B', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        await expect(
          client.query(
            `INSERT INTO public.categories (user_id, name, type) VALUES ($1, 'Hacked', 'expense')`,
            [USER_B]
          )
        ).rejects.toThrow()
        await client.query('ROLLBACK')
      } finally {
        client.release()
      }
    })

    it('User A CANNOT update User B category', async () => {
      const clientB = await pool!.connect()
      let bCatId: string
      try {
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const r = await clientB.query('SELECT id FROM public.categories LIMIT 1')
        bCatId = r.rows[0].id
        await clientB.query('COMMIT')
      } finally {
        clientB.release()
      }

      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `UPDATE public.categories SET name = 'hacked' WHERE id = $1`,
          [bCatId]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT delete User B category', async () => {
      const clientB = await pool!.connect()
      let bCatId: string
      try {
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const r = await clientB.query('SELECT id FROM public.categories LIMIT 1')
        bCatId = r.rows[0].id
        await clientB.query('COMMIT')
      } finally {
        clientB.release()
      }

      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `DELETE FROM public.categories WHERE id = $1`,
          [bCatId]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })
  })

  // ---------------------------------------------------------------------------
  // CATEGORY_GROUPS
  // ---------------------------------------------------------------------------
  describe('category_groups', () => {
    it('User A can read their own category groups', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.category_groups')
        await client.query('COMMIT')
        expect(result.rows.length).toBeGreaterThan(0)
        for (const row of result.rows) {
          expect(row.user_id).toBe(USER_A)
        }
      } finally {
        client.release()
      }
    })

    it('User A CANNOT read User B category groups', async () => {
      const clientB = await pool!.connect()
      let bGroupId: string
      try {
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const r = await clientB.query('SELECT id FROM public.category_groups LIMIT 1')
        bGroupId = r.rows[0].id
        await clientB.query('COMMIT')
      } finally {
        clientB.release()
      }

      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query('SELECT * FROM public.category_groups WHERE id = $1', [bGroupId])
        await client.query('COMMIT')
        expect(result.rows.length).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT insert a category group for User B', async () => {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        await expect(
          client.query(
            `INSERT INTO public.category_groups (user_id, name, sort_order) VALUES ($1, 'Hacked', 99)`,
            [USER_B]
          )
        ).rejects.toThrow()
        await client.query('ROLLBACK')
      } finally {
        client.release()
      }
    })

    it('User A CANNOT update User B category group', async () => {
      const clientB = await pool!.connect()
      let bGroupId: string
      try {
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const r = await clientB.query('SELECT id FROM public.category_groups LIMIT 1')
        bGroupId = r.rows[0].id
        await clientB.query('COMMIT')
      } finally {
        clientB.release()
      }

      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `UPDATE public.category_groups SET name = 'hacked' WHERE id = $1`,
          [bGroupId]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })

    it('User A CANNOT delete User B category group', async () => {
      const clientB = await pool!.connect()
      let bGroupId: string
      try {
        await clientB.query('BEGIN')
        await asUser(clientB, USER_B)
        const r = await clientB.query('SELECT id FROM public.category_groups LIMIT 1')
        bGroupId = r.rows[0].id
        await clientB.query('COMMIT')
      } finally {
        clientB.release()
      }

      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        await asUser(client, USER_A)
        const result = await client.query(
          `DELETE FROM public.category_groups WHERE id = $1`,
          [bGroupId]
        )
        await client.query('COMMIT')
        expect(result.rowCount).toBe(0)
      } finally {
        client.release()
      }
    })
  })
})