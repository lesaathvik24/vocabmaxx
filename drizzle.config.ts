import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'db.qbogwjfneuswzwdykoxf.supabase.co',
    port: 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME ?? 'postgres',
    ssl: true,
  },
})
