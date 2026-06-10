import 'server-only'
import * as prefsQ from '@/lib/db/queries/preferences'
import type { UserPreferencesRow } from '@/lib/db/queries/preferences'
import type { PreferencesPatch } from '@/lib/validation/preferences.schema'

export type Theme = 'light' | 'dark'

export interface UserPreferences {
    displayName: string | null
    theme: Theme
    dailyDigest: boolean
    digestHour: number
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    displayName: null,
    theme: 'dark',
    dailyDigest: false,
    digestHour: 14,
}

/**
 * Normalise a raw DB row (or null) into a complete preferences object, filling
 * defaults for anything missing. Theme is clamped to a known value so a bad
 * stored string can never break the UI. Pure — unit-tested directly.
 */
export function applyDefaults(row: UserPreferencesRow | null): UserPreferences {
    if (!row) return { ...DEFAULT_PREFERENCES }
    return {
        displayName: row.displayName ?? null,
        theme: row.theme === 'light' ? 'light' : 'dark',
        dailyDigest: row.dailyDigest,
        digestHour: row.digestHour,
    }
}

/**
 * Normalise a validated patch for storage: an empty/whitespace display name
 * becomes null (clearing it) rather than an empty string. Pure.
 */
export function normalizePatch(patch: PreferencesPatch): prefsQ.UpsertPreferencesFields {
    const out: prefsQ.UpsertPreferencesFields = {}
    if (patch.displayName !== undefined) {
        const trimmed = patch.displayName?.trim() ?? ''
        out.displayName = trimmed.length > 0 ? trimmed : null
    }
    if (patch.theme !== undefined) out.theme = patch.theme
    if (patch.dailyDigest !== undefined) out.dailyDigest = patch.dailyDigest
    if (patch.digestHour !== undefined) out.digestHour = patch.digestHour
    return out
}

export interface PreferencesDeps {
    getByUser(userId: string): Promise<UserPreferencesRow | null>
    upsert(userId: string, fields: prefsQ.UpsertPreferencesFields): Promise<UserPreferencesRow>
}

const defaultDeps: PreferencesDeps = {
    getByUser: prefsQ.getByUser,
    upsert: prefsQ.upsert,
}

export async function get(
    userId: string,
    deps: PreferencesDeps = defaultDeps,
): Promise<UserPreferences> {
    const row = await deps.getByUser(userId)
    return applyDefaults(row)
}

export async function update(
    userId: string,
    patch: PreferencesPatch,
    deps: PreferencesDeps = defaultDeps,
): Promise<UserPreferences> {
    const row = await deps.upsert(userId, normalizePatch(patch))
    return applyDefaults(row)
}
