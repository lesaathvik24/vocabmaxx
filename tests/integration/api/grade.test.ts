import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/api', () => ({ getUserForApi: vi.fn() }))
vi.mock('@/lib/services/srs.service', () => ({ recordReview: vi.fn(), listDue: vi.fn() }))

import { POST } from '@/app/api/review/grade/route'
import { GET } from '@/app/api/review/due/route'
import { getUserForApi } from '@/lib/auth/api'
import * as srsService from '@/lib/services/srs.service'

const mockedUser = vi.mocked(getUserForApi)
const mockedRecord = vi.mocked(srsService.recordReview)
const mockedListDue = vi.mocked(srsService.listDue)

const WORD_ID = '11111111-1111-4111-8111-111111111111'

function req(body: unknown): Request {
    return new Request('http://test.local/api/review/grade', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    })
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('POST /api/review/grade', () => {
    it('401 when unauthenticated', async () => {
        mockedUser.mockResolvedValue(null)
        const res = await POST(req({ wordId: WORD_ID, grade: 4 }))
        expect(res.status).toBe(401)
        expect(mockedRecord).not.toHaveBeenCalled()
    })

    it('400 on malformed JSON body', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req('not-json'))
        expect(res.status).toBe(400)
    })

    it('400 on non-uuid wordId', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req({ wordId: 'abc', grade: 4 }))
        expect(res.status).toBe(400)
        expect(mockedRecord).not.toHaveBeenCalled()
    })

    it('400 on grade outside {0,3,4,5}', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req({ wordId: WORD_ID, grade: 2 }))
        expect(res.status).toBe(400)
        expect(mockedRecord).not.toHaveBeenCalled()
    })

    it('404 when word not found for user', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedRecord.mockResolvedValue({ ok: false, error: { kind: 'word_not_found' } })
        const res = await POST(req({ wordId: WORD_ID, grade: 4 }))
        expect(res.status).toBe(404)
        const body = (await res.json()) as { error: { kind: string } }
        expect(body.error.kind).toBe('word_not_found')
    })

    it('200 returns nextDue ISO string and newState; scopes to authed user', async () => {
        const due = new Date('2026-06-16T00:00:00.000Z')
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedRecord.mockResolvedValue({
            ok: true,
            value: {
                state: { easeFactor: 2.5, intervalDays: 6, repetitions: 2 },
                dueDate: due,
            },
        })

        const res = await POST(req({ wordId: WORD_ID, grade: 4 }))
        expect(res.status).toBe(200)
        const body = (await res.json()) as {
            data: { nextDue: string; newState: { intervalDays: number } }
        }
        expect(body.data.nextDue).toBe(due.toISOString())
        expect(body.data.newState.intervalDays).toBe(6)
        expect(mockedRecord).toHaveBeenCalledWith('u1', WORD_ID, 4)
    })
})

describe('GET /api/review/due', () => {
    it('401 when unauthenticated', async () => {
        mockedUser.mockResolvedValue(null)
        const res = await GET()
        expect(res.status).toBe(401)
        expect(mockedListDue).not.toHaveBeenCalled()
    })

    it('200 returns due cards for the authed user only', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedListDue.mockResolvedValue([
            {
                id: WORD_ID,
                userId: 'u1',
                term: 'alacrity',
                definition: 'eagerness',
                examples: ['ex'],
                source: 'dictionary', phonetic: null, audioUrl: null,
                addedAt: new Date(),
                srs: {
                    easeFactor: 2.5,
                    intervalDays: 0,
                    repetitions: 0,
                    dueDate: new Date(),
                    lastReviewedAt: null,
                },
            },
        ])

        const res = await GET()
        expect(res.status).toBe(200)
        const body = (await res.json()) as { data: { cards: { term: string }[] } }
        expect(body.data.cards).toHaveLength(1)
        expect(body.data.cards[0].term).toBe('alacrity')
        expect(mockedListDue).toHaveBeenCalledWith('u1')
    })
})
