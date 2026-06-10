import { describe, it, expect, vi } from 'vitest'
import {
    applyDefaults,
    normalizePatch,
    DEFAULT_PREFERENCES,
    get,
    update,
    type PreferencesDeps,
} from '@/lib/services/preferences.service'
import type { UserPreferencesRow } from '@/lib/db/queries/preferences'

function makeRow(overrides: Partial<UserPreferencesRow> = {}): UserPreferencesRow {
    return {
        userId: 'u1',
        displayName: 'Ada',
        theme: 'light',
        dailyDigest: true,
        digestHour: 9,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        updatedAt: new Date('2026-06-01T00:00:00Z'),
        ...overrides,
    }
}

describe('applyDefaults', () => {
    it('returns the default preferences when the row is null', () => {
        expect(applyDefaults(null)).toEqual(DEFAULT_PREFERENCES)
    })

    it('maps a populated row through faithfully', () => {
        expect(applyDefaults(makeRow())).toEqual({
            displayName: 'Ada',
            theme: 'light',
            dailyDigest: true,
            digestHour: 9,
        })
    })

    it('clamps an unknown stored theme to dark', () => {
        expect(applyDefaults(makeRow({ theme: 'solarized' })).theme).toBe('dark')
    })

    it('coalesces a null display name', () => {
        expect(applyDefaults(makeRow({ displayName: null })).displayName).toBeNull()
    })
})

describe('normalizePatch', () => {
    it('turns a blank display name into null (clearing it)', () => {
        expect(normalizePatch({ displayName: '   ' })).toEqual({ displayName: null })
    })

    it('trims a non-empty display name', () => {
        expect(normalizePatch({ displayName: '  Ada  ' })).toEqual({ displayName: 'Ada' })
    })

    it('passes through theme / digest fields untouched', () => {
        expect(normalizePatch({ theme: 'dark', dailyDigest: true, digestHour: 7 })).toEqual({
            theme: 'dark',
            dailyDigest: true,
            digestHour: 7,
        })
    })

    it('omits fields that were not provided', () => {
        expect(normalizePatch({ theme: 'light' })).toEqual({ theme: 'light' })
    })
})

describe('get', () => {
    it('returns defaults when no row exists', async () => {
        const deps: PreferencesDeps = {
            getByUser: vi.fn().mockResolvedValue(null),
            upsert: vi.fn(),
        }
        expect(await get('u1', deps)).toEqual(DEFAULT_PREFERENCES)
    })
})

describe('update', () => {
    it('normalises the patch before upserting and returns the new prefs', async () => {
        const upsert = vi.fn().mockResolvedValue(makeRow({ displayName: 'Grace', theme: 'dark' }))
        const deps: PreferencesDeps = { getByUser: vi.fn(), upsert }
        const result = await update('u1', { displayName: '  Grace  ', theme: 'dark' }, deps)
        expect(upsert).toHaveBeenCalledWith('u1', { displayName: 'Grace', theme: 'dark' })
        expect(result.displayName).toBe('Grace')
        expect(result.theme).toBe('dark')
    })
})
