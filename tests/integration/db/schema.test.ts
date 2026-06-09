import { describe, it, expect, afterAll } from 'vitest'
import postgres from 'postgres'

const EXPECTED_TABLES = ['words', 'srs_state', 'review_log', 'import_jobs', 'definition_cache']

describe.skipIf(!process.env.DATABASE_URL)('DB schema introspection', () => {
    const sql = postgres(process.env.DATABASE_URL!)

    afterAll(async () => {
        await sql.end()
    })

    it('all 5 public tables exist', async () => {
        const rows = await sql<{ tablename: string }[]>`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
        `
        const names = rows.map(r => r.tablename)
        for (const table of EXPECTED_TABLES) {
            expect(names, `expected table "${table}" to exist`).toContain(table)
        }
    })

    it('RLS is enabled on all 5 tables', async () => {
        const rows = await sql<{ tablename: string; rowsecurity: boolean }[]>`
            SELECT tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename = ANY(${EXPECTED_TABLES})
        `
        for (const table of EXPECTED_TABLES) {
            const row = rows.find(r => r.tablename === table)
            expect(row, `"${table}" not found in pg_tables`).toBeDefined()
            expect(row!.rowsecurity, `RLS not enabled on "${table}"`).toBe(true)
        }
    })

    it('RLS policies exist on all 5 tables', async () => {
        const USER_TABLES = ['words', 'srs_state', 'review_log', 'import_jobs'] as const
        const rows = await sql<{ tablename: string; policyname: string }[]>`
            SELECT tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
        `
        const byTable = new Map<string, string[]>()
        for (const r of rows) {
            const existing = byTable.get(r.tablename) ?? []
            existing.push(r.policyname)
            byTable.set(r.tablename, existing)
        }

        for (const table of USER_TABLES) {
            const policies = byTable.get(table) ?? []
            expect(policies.length, `no policies on "${table}"`).toBeGreaterThan(0)
            expect(policies, `"owner_all" policy missing on "${table}"`).toContain('owner_all')
        }

        const cachePolicies = byTable.get('definition_cache') ?? []
        expect(cachePolicies.length, `no policies on "definition_cache"`).toBeGreaterThan(0)
        expect(cachePolicies, `"public_read" policy missing on "definition_cache"`).toContain('public_read')
    })
})
