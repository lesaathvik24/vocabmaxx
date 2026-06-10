import 'server-only'
import { z } from 'zod'
import { type Result, ok, err, type DefinitionError, type LLMError } from '@/lib/domain/errors'
import type { DefinitionResult } from './dict.client'

const TIMEOUT_MS = 15_000
const MAX_TOKENS = 200
const EXTRACT_MAX_TOKENS = 600

const definitionLLMSchema = z.object({
    definition: z.string().min(1).max(500),
    examples: z.array(z.string().min(1).max(300)).length(2),
})

const extractLLMSchema = z.object({
    terms: z.array(
        z.object({
            term: z.string().min(1),
            context: z.string().min(1),
            confidence: z.number().min(0).max(1),
        }),
    ),
})

const DEFINITION_SYSTEM =
    'You are a vocabulary tutor for an advanced English speaker. Given a single word, output strict JSON with one concise definition (max 25 words) and exactly two natural usage examples from contexts like podcasts, journalism, or conversation. Schema: {"definition":string,"examples":[string,string]}. Output JSON only — no markdown, no preamble.'

const EXTRACT_SYSTEM =
    'Given a paragraph of English text, identify the advanced or unusual vocabulary likely unfamiliar to a B2-level reader. Return strict JSON. For each term include the lowercased form, the surrounding sentence as context, and a confidence score 0..1. Schema: {"terms":[{"term":string,"context":string,"confidence":number}]}. Output JSON only — no markdown, no preamble.'

export async function fetchLLMDefinition(term: string): Promise<Result<DefinitionResult, DefinitionError>> {
    if (!process.env.DEEPSEEK_API_KEY) return err({ kind: 'no_fallback_available' })

    const result = await callDeepSeek({
        system: DEFINITION_SYSTEM,
        user: term,
        maxTokens: MAX_TOKENS,
    })
    if (!result.ok) return err(result.error as DefinitionError)

    let parsed: unknown
    try {
        parsed = JSON.parse(result.value)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    const validated = definitionLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })

    return ok({ definition: validated.data.definition, examples: validated.data.examples, source: 'llm' })
}

export interface ExtractedCandidate {
    term: string
    context: string
    confidence: number
}

export async function extractCandidates(text: string): Promise<Result<ExtractedCandidate[], LLMError>> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) return err({ kind: 'no_fallback_available' })

    const result = await callDeepSeek({
        system: EXTRACT_SYSTEM,
        user: text,
        maxTokens: EXTRACT_MAX_TOKENS,
    })
    if (!result.ok) return err(result.error)

    let parsed: unknown
    try {
        parsed = JSON.parse(result.value)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    const validated = extractLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })

    const filtered = validated.data.terms
        .filter(t => t.confidence > 0.5)
        .slice(0, 20)
        .map(t => ({ term: t.term.toLowerCase(), context: t.context, confidence: t.confidence }))

    return ok(filtered)
}

async function callDeepSeek({
    system,
    user,
    maxTokens,
}: {
    system: string
    user: string
    maxTokens: number
}): Promise<Result<string, LLMError>> {
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
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                temperature: 0,
                max_tokens: maxTokens,
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

    return ok(content)
}

function extractContent(envelope: unknown): string | null {
    if (!envelope || typeof envelope !== 'object') return null
    const choices = (envelope as { choices?: unknown }).choices
    if (!Array.isArray(choices) || choices.length === 0) return null
    const msg = (choices[0] as { message?: { content?: unknown } }).message
    const content = msg?.content
    return typeof content === 'string' ? content : null
}
