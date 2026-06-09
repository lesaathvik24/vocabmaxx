import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { fetchDefinition } from '@/lib/services/dict.client'

const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/:term'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('dict.client.fetchDefinition', () => {
    it('success: returns first definition + example', async () => {
        server.use(
            http.get(ENDPOINT, () =>
                HttpResponse.json([
                    {
                        meanings: [
                            { definitions: [{ definition: 'a brief example def', example: 'example sentence' }] },
                        ],
                    },
                ]),
            ),
        )
        const r = await fetchDefinition('alpha')
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.value.definition).toBe('a brief example def')
            expect(r.value.examples).toEqual(['example sentence'])
            expect(r.value.source).toBe('dictionary')
        }
    })

    it('404: returns not_found', async () => {
        server.use(http.get(ENDPOINT, () => new HttpResponse(null, { status: 404 })))
        const r = await fetchDefinition('xyzzzzz')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('not_found')
    })

    it('definition present but no example: not_found (forces LLM fallback)', async () => {
        server.use(
            http.get(ENDPOINT, () =>
                HttpResponse.json([{ meanings: [{ definitions: [{ definition: 'has def, no example' }] }] }]),
            ),
        )
        const r = await fetchDefinition('plain')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('not_found')
    })

    it('500: returns network_failure', async () => {
        server.use(http.get(ENDPOINT, () => new HttpResponse(null, { status: 500 })))
        const r = await fetchDefinition('boom')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('network_failure')
    })
})
