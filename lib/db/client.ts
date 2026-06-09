import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDb | undefined

// Lazy singleton — postgres() is not called at module import time.
// First access validates DATABASE_URL and creates the connection.
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    if (!_db) {
      const url = process.env.DATABASE_URL
      if (!url) throw new Error('DATABASE_URL env var is not set')
      // prepare: false required for Supabase pgBouncer in transaction mode
      _db = drizzle(
        postgres(url, {
          prepare: false,
          max: 1,
          idle_timeout: 20,
          connect_timeout: 10,
        }),
        { schema },
      )
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop]
  },
})
