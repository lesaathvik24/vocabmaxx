import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Grade } from '@/lib/domain/grade'

vi.mock('@/lib/db/client', () => {
    const txState = { srs: null as null | { easeFactor: number; intervalDays: number; repetitions: number; userId: string; wordId: string }, log: [] as { userId: string; wordId: string; grade: number }[] }

    const tx = {
        select: () => ({
            from: () => ({
                where: () => ({
                    for: () => ({ limit: async () => (txState.srs ? [txState.srs] : []) }),
                }),
            }),
        }),
        update: () => ({ set: (v: Record<string, unknown>) => ({ where: async () => { if (txState.srs) Object.assign(txState.srs, v) } }) }),
        insert: () => ({ values: async (v: { userId: string; wordId: string; grade: number }) => { txState.log.push(v) } }),
    }

    return {
        db: {
            transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
            __state: txState,
        },
    }
})

import * as srsService from '@/lib/services/srs.service'
import { db } from '@/lib/db/client'

const state = (db as unknown as { __state: { srs: null | { easeFactor: number; intervalDays: number; repetitions: number; userId: string; wordId: string }; log: { userId: string; wordId: string; grade: number }[] } }).__state

beforeEach(() => {
    state.srs = null
    state.log = []
})

const NOW = new Date('2024-01-01T00:00:00Z')

describe('srs.service.recordReview (unit, mocked DB)', () => {
    it('returns word_not_found when no srs row', async () => {
        const r = await srsService.recordReview('u', 'w', Grade.Good, NOW)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('word_not_found')
    })

    it('updates state and appends log on success', async () => {
        state.srs = { userId: 'u', wordId: 'w', easeFactor: 2.5, intervalDays: 0, repetitions: 0 }
        const r = await srsService.recordReview('u', 'w', Grade.Good, NOW)
        expect(r.ok).toBe(true)
        expect(state.srs.repetitions).toBe(1)
        expect(state.srs.intervalDays).toBe(1)
        expect(state.log).toHaveLength(1)
        expect(state.log[0].grade).toBe(Grade.Good)
    })

    it('Again resets repetitions in stored state', async () => {
        state.srs = { userId: 'u', wordId: 'w', easeFactor: 2.5, intervalDays: 30, repetitions: 5 }
        await srsService.recordReview('u', 'w', Grade.Again, NOW)
        expect(state.srs.repetitions).toBe(0)
        expect(state.srs.intervalDays).toBe(1)
    })
})
