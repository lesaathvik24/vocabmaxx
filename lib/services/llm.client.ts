import 'server-only'
import { z } from 'zod'
import { type Result, ok, err, type DefinitionError } from '@/lib/domain/errors'
import type { DefinitionResult } from './dict.client'

const TIMEOUT_MS = 15_000
const MAX_TOKENS = 200

const definitionLLMSchema = z.object({
    definition: z.string().min(1).max(500),
    examples: z.array(z.string().min(1).max(300)).length(2),
})

const SYSTEM = 'You are a vocabulary tutor for an advanced English speaker. Given a single word, output strict JSON with one concise definition (max 25 words) and exactly two natural usage examples from contexts like podcasts, journalism, or conversation. Schema: {"definition":string,"examples":[string,string]}. Output JSON only — no markdown, no preamble.'

export async function fetchLLMDefinition(term: string): Promise<Result<DefinitionResult, DefinitionError>> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'
    if (!apiKey) return err({ kind: 'no_fallback_available' })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let res: Response
    try {
        res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                authorization: `Bearer ${apiKey}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM },
                    { role: 'user', content: term },
                ],
                temperature: 0,
                max_tokens: MAX_TOKENS,
                response_format: { type: 'json_object' },
            }),
        })
    } catch (e) {
        return err({ kind: 'network_failure', cause: e instanceof Error ? e.message : String(e) })
    } finally {
        clearTimeout(timer)
    }

    if (res.status === 429) return err({ kind: 'rate_limited' })
    if (!res.ok) return err({ kind: 'network_failure', cause: `llm status ${res.status}` })

    let envelope: unknown
    try {
        envelope = await res.json()
    } catch {
        return err({ kind: 'malformed_llm_response', raw: '<unparseable>' })
    }

    const content = extractContent(envelope)
    if (!content) return err({ kind: 'malformed_llm_response', raw: JSON.stringify(envelope).slice(0, 200) })

    let parsed: unknown
    try {
        parsed = JSON.parse(content)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: content.slice(0, 200) })
    }

    const validated = definitionLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: content.slice(0, 200) })

    return ok({ definition: validated.data.definition, examples: validated.data.examples, source: 'llm' })
}

function extractContent(envelope: unknown): string | null {
    if (!envelope || typeof envelope !== 'object') return null
    const choices = (envelope as { choices?: unknown }).choices
    if (!Array.isArray(choices) || choices.length === 0) return null
    const msg = (choices[0] as { message?: { content?: unknown } }).message
    const content = msg?.content
    return typeof content === 'string' ? content : null
}
