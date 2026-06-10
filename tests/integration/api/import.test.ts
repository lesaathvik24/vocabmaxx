import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/api', () => ({ getUserForApi: vi.fn() }))
vi.mock('@/lib/services/import.service', () => ({
    extract: vi.fn(),
    saveBulk: vi.fn(),
}))

import { POST } from '@/app/api/words/import/route'
import { getUserForApi } from '@/lib/auth/api'
import * as importService from '@/lib/services/import.service'
import { ok, err } from '@/lib/domain/errors'

const mockedUser = vi.mocked(getUserForApi)
const mockedExtract = vi.mocked(importService.extract)
const mockedSaveBulk = vi.mocked(importService.saveBulk)

function req(body: unknown): Request {
    return new Request('http://test.local/api/words/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    })
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/words/import', () => {
    it('401 when unauthenticated', async () => {
        mockedUser.mockResolvedValue(null)
        const res = await POST(req({ mode: 'extract', text: 'hello world' }))
        expect(res.status).toBe(401)
        expect(mockedExtract).not.toHaveBeenCalled()
    })

    it('400 on invalid body (missing mode)', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req({ text: 'hello' }))
        expect(res.status).toBe(400)
    })

    it('400 on malformed JSON', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req('not-json'))
        expect(res.status).toBe(400)
    })

    it('400 on extract mode when text too long', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedExtract.mockResolvedValue(err({ kind: 'invalid_input', message: 'too long' }))
        const res = await POST(req({ mode: 'extract', text: 'a'.repeat(5001) }))
        // Zod schema itself rejects text > 5000 → 400 from schema validation
        expect(res.status).toBe(400)
        expect(mockedExtract).not.toHaveBeenCalled()
    })

    it('200 extract happy path returns candidates', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedExtract.mockResolvedValue(ok(['ephemeral', 'lucid', 'tenacious']))
        const res = await POST(req({ mode: 'extract', text: 'The ephemeral beauty of the morning.' }))
        expect(res.status).toBe(200)
        const body = (await res.json()) as { data: { candidates: string[] } }
        expect(body.data.candidates).toEqual(['ephemeral', 'lucid', 'tenacious'])
    })

    it('200 save with mixed results returns correct summary', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedSaveBulk.mockResolvedValue(ok({ added: 3, skipped: 1, failed: 1, addedTerms: ['a', 'b', 'c'] }))
        const res = await POST(req({ mode: 'save', terms: ['a', 'b', 'c', 'd', 'e'] }))
        expect(res.status).toBe(200)
        const body = (await res.json()) as { data: { added: number; skipped: number; failed: number } }
        expect(body.data.added).toBe(3)
        expect(body.data.skipped).toBe(1)
        expect(body.data.failed).toBe(1)
    })

    it('400 on save mode with empty terms array (Zod)', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        const res = await POST(req({ mode: 'save', terms: [] }))
        expect(res.status).toBe(400)
        expect(mockedSaveBulk).not.toHaveBeenCalled()
    })

    it('503 on extract when LLM rate-limited', async () => {
        mockedUser.mockResolvedValue({ id: 'u1' } as never)
        mockedExtract.mockResolvedValue(err({ kind: 'rate_limited' }))
        const res = await POST(req({ mode: 'extract', text: 'some text' }))
        expect(res.status).toBe(503)
    })
})
