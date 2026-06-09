import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/api', () => ({ getUserForApi: vi.fn() }))
vi.mock('@/lib/services/definition.service', () => ({ fetchDefinition: vi.fn() }))
vi.mock('@/lib/services/word.service', () => ({ save: vi.fn() }))

import { POST } from '@/app/api/capture/route'
import { getUserForApi } from '@/lib/auth/api'
import * as definitionService from '@/lib/services/definition.service'
import * as wordService from '@/lib/services/word.service'

const mockedUser = vi.mocked(getUserForApi)
const mockedFetch = vi.mocked(definitionService.fetchDefinition)
const mockedSave = vi.mocked(wordService.save)

function req(body: unknown): Request {
    return new Request('http://test.local/api/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    })
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('POST /api/capture', () => {
    it('401 when unauthenticated', async () => {
        mockedUser.mockResolvedValue(null)
        const res = await POST(req({ term: 'word' }))
        expect(res.status).toBe(401)
        expect(mockedFetch).not.toHaveBeenCalled()
    })

    it('400 on invalid term', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req({ term: '123abc' }))
        expect(res.status).toBe(400)
        expect(mockedFetch).not.toHaveBeenCalled()
    })

    it('400 on malformed JSON body', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req('not-json'))
        expect(res.status).toBe(400)
    })

    it('200 on success — returns saved word', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedFetch.mockResolvedValue({
            ok: true,
            value: { term: 'ubiquitous', def: { definition: 'd', examples: ['e'], source: 'dictionary' } },
        })
        mockedSave.mockResolvedValue({
            ok: true,
            value: {
                id: 'w1',
                userId: 'u1',
                term: 'ubiquitous',
                definition: 'd',
                examples: ['e'],
                source: 'dictionary',
                addedAt: new Date(),
            },
        })

        const res = await POST(req({ term: 'ubiquitous' }))
        expect(res.status).toBe(200)
        const body = (await res.json()) as { data: { word: { term: string } } }
        expect(body.data.word.term).toBe('ubiquitous')
    })

    it('409 on duplicate_term', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedFetch.mockResolvedValue({
            ok: true,
            value: { term: 'dup', def: { definition: 'd', examples: ['e'], source: 'dictionary' } },
        })
        mockedSave.mockResolvedValue({ ok: false, error: { kind: 'duplicate_term' } })

        const res = await POST(req({ term: 'dup' }))
        expect(res.status).toBe(409)
        const body = (await res.json()) as { error: { kind: string } }
        expect(body.error.kind).toBe('duplicate_term')
    })

    it('404 when definition lookup returns not_found', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedFetch.mockResolvedValue({ ok: false, error: { kind: 'not_found' } })
        const res = await POST(req({ term: 'xyzqqq' }))
        expect(res.status).toBe(404)
    })

    it('502 on malformed_llm_response', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedFetch.mockResolvedValue({ ok: false, error: { kind: 'malformed_llm_response', raw: '...' } })
        const res = await POST(req({ term: 'word' }))
        expect(res.status).toBe(502)
        const body = (await res.json()) as { error: { kind: string; raw?: string } }
        expect(body.error.kind).toBe('malformed_llm_response')
        expect(body.error.raw).toBeUndefined()
    })
})
