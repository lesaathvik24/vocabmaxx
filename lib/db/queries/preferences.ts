import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { db } from '../client'
import { userPreferences } from '../schema'

export interface UserPreferencesRow {
    userId: string
    displayName: string | null
    theme: string
    dailyDigest: boolean
    digestHour: number
    createdAt: Date
    updatedAt: Date
}

/** Postgres "undefined table" — the migration has not been applied yet. */
function isMissingTable(e: unknown): boolean {
    return typeof e === 'object' && e !== null && (e as { code?: string }).code === '42P01'
}

/**
 * The current user's preferences row, or null when absent. Also returns null
 * (instead of throwing) when the table itself does not exist yet, so the app
 * degrades to defaults if `0003_user_preferences.sql` has not been applied.
 */
export async function getByUser(userId: string): Promise<UserPreferencesRow | null> {
    try {
        const [row] = await db
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId))
            .limit(1)
        return row ?? null
    } catch (e) {
        if (isMissingTable(e)) return null
        throw e
    }
}

export interface UpsertPreferencesFields {
    displayName?: string | null
    theme?: string
    dailyDigest?: boolean
    digestHour?: number
}

/** Insert-or-update the user's single preferences row, bumping `updated_at`. */
export async function upsert(
    userId: string,
    fields: UpsertPreferencesFields,
): Promise<UserPreferencesRow> {
    const [row] = await db
        .insert(userPreferences)
        .values({ userId, ...fields })
        .onConflictDoUpdate({
            target: userPreferences.userId,
            set: { ...fields, updatedAt: sql`now()` },
        })
        .returning()
    return row
}

/** Everyone who has opted into the daily digest at the given UTC hour. */
export async function listDigestRecipients(
    hour: number,
): Promise<{ userId: string; digestHour: number }[]> {
    const rows = await db
        .select({ userId: userPreferences.userId, digestHour: userPreferences.digestHour })
        .from(userPreferences)
        .where(eq(userPreferences.dailyDigest, true))
    return rows.filter((r) => r.digestHour === hour)
}
