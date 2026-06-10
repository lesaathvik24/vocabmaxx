import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { fetchLLMDefinition } from '@/lib/services/llm.client'

const ENDPOINT = 'https://api.deepseek.com/chat/completions'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = 'test-key'
    process.env.DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function chat(content: string) {
    return HttpResponse.json({ choices: [{ message: { content } }] })
}

describe('llm.client.fetchLLMDefinition', () => {
    it('success: parses strict JSON envelope into DefinitionResult', async () => {
        server.use(
            http.post(ENDPOINT, () =>
                chat(JSON.stringify({ valid: true, definition: 'rare word', examples: ['ex one', 'ex two'] })),
            ),
        )
        const r = await fetchLLMDefinition('rare')
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.value.definition).toBe('rare word')
            expect(r.value.examples).toEqual(['ex one', 'ex two'])
            expect(r.value.source).toBe('llm')
        }
    })

    it('valid=false: returns not_a_word', async () => {
        server.use(http.post(ENDPOINT, () => chat(JSON.stringify({ valid: false }))))
        const r = await fetchLLMDefinition('hufwueriugrniurejogt')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('not_a_word')
    })

    it('429: returns rate_limited', async () => {
        server.use(http.post(ENDPOINT, () => new HttpResponse(null, { status: 429 })))
        const r = await fetchLLMDefinition('rare')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('rate_limited')
    })

    it('schema mismatch (wrong number of examples): malformed_llm_response', async () => {
        server.use(
            http.post(ENDPOINT, () => chat(JSON.stringify({ valid: true, definition: 'd', examples: ['only-one'] }))),
        )
        const r = await fetchLLMDefinition('rare')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('malformed_llm_response')
    })

    it('non-JSON content body: malformed_llm_response', async () => {
        server.use(http.post(ENDPOINT, () => chat('not-json-at-all')))
        const r = await fetchLLMDefinition('rare')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('malformed_llm_response')
    })

    it('missing API key: no_fallback_available without HTTP call', async () => {
        delete process.env.DEEPSEEK_API_KEY
        let called = false
        server.use(
            http.post(ENDPOINT, () => {
                called = true
                return chat('{}')
            }),
        )
        const r = await fetchLLMDefinition('rare')
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('no_fallback_available')
        expect(called).toBe(false)
    })
})
