const testUrl = process.env.SUPABASE_TEST_DB_URL
if (!testUrl) {
    throw new Error('SUPABASE_TEST_DB_URL is not set — integration tests require a separate Supabase project. See docs/ROADMAP.md Phase 2 setup. The test:integ script loads .env.local via dotenv-cli; check it has SUPABASE_TEST_DB_URL.')
}

process.env.DATABASE_URL = testUrl
