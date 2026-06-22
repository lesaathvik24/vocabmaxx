import 'server-only'
import { z } from 'zod'
import { type Result, ok, err, type DefinitionError, type LLMError } from '@/lib/domain/errors'
import type { DefinitionResult } from './dict.client'

const TIMEOUT_MS = 15_000
const MAX_TOKENS = 200
const EXTRACT_MAX_TOKENS = 600

const definitionLLMSchema = z.object({
    valid: z.boolean(),
    definition: z.string().max(500).optional(),
    examples: z.array(z.string().max(300)).max(3).optional(),
})

const extractLLMSchema = z.object({
    terms: z.array(z.string().min(1).max(64)),
})

const correctionLLMSchema = z.object({
    correction: z.string().max(64).nullable(),
})

const scenarioLLMSchema = z.object({
    scenario: z.string().min(1).max(300),
    channel: z.enum(['irl', 'text']),
})

const judgeLLMSchema = z.object({
    correct: z.boolean(),
    reason: z.string().min(1).max(300),
})

const DEFINITION_SYSTEM =
    'You are a vocabulary tutor for an advanced English speaker. Given a single word, return strict JSON. Schema: {"valid": boolean, "definition": string, "examples": [string, string]}. If the input is a real English word (including rare, archaic, technical, or coined-but-recognised terms): set valid=true, provide a concise definition (max 25 words) and exactly two natural usage examples from contexts like podcasts, journalism, or conversation. If the input is gibberish, a typo, a random keyboard mash, or not an English word: set valid=false and omit definition/examples. Output JSON only — no markdown, no preamble, no "I cannot" prose.'

const CORRECTION_SYSTEM =
    'You are a forgiving spelling corrector for an English vocabulary app. The user typed a string that is NOT a recognized English word. If it is plausibly a misspelling of a single real English word, return that word — be generous with edit distance and phonetic guesses (e.g. "exaacerbait" -> "exacerbate", "definately" -> "definitely", "rythm" -> "rhythm", "acommodate" -> "accommodate"). Return strict JSON ONLY: {"correction": string | null}. Set correction to the single most likely intended word, lowercased, letters only. If it is random keyboard mash, an abbreviation, or you cannot map it to a real English word with reasonable confidence, return {"correction": null}. No markdown, no preamble.'

const EXTRACT_SYSTEM =
    'You extract advanced vocabulary from English paragraphs for a B2+ learner. Return strict JSON ONLY in this exact schema: {"terms": ["word1", "word2", ...]}. Rules: 5-15 items. Each item is a single lowercased word (1-2 words max, no phrases > 2 words, no proper nouns, no common words). No commentary, no markdown, no preamble. If the paragraph is empty or has no advanced vocabulary, return {"terms": []}.'

const SCENARIO_SYSTEM =
    'You design a short real-life "sidequest" that challenges a vocabulary learner to USE a given word. You are given the word and its definition. Return strict JSON ONLY: {"scenario": string, "channel": "irl" | "text"}. The scenario is one sentence (max 30 words) describing a realistic situation in which to naturally work the word into something they say or write — e.g. "Work this word into a text to a friend about a movie you disliked." Pick channel "irl" for spoken/in-person missions and "text" for written/messaging missions. NEVER include an example sentence using the word — the learner must produce that themselves. No markdown, no preamble.'

const JUDGE_SYSTEM =
    'You judge whether a vocabulary learner used a target word correctly and naturally in a sentence they submitted. You are given the word, its definition, and the learner\'s sentence. Return strict JSON ONLY: {"correct": boolean, "reason": string}. Set correct=true only if the sentence actually contains the word (or a valid inflection of it) AND uses it in a way consistent with the definition and natural English. Set correct=false if the word is absent, misused, or the sentence is nonsense. The reason is one short sentence (max 25 words) of friendly, specific feedback. No markdown, no preamble.'

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

    if (!validated.data.valid) return err({ kind: 'not_a_word' })

    const { definition, examples } = validated.data
    if (!definition || !examples || examples.length < 2) {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    return ok({ definition, examples: [examples[0], examples[1]], source: 'llm' })
}

/**
 * Ask the LLM for the most likely intended spelling of a term that failed
 * definition lookup. Returns the suggested word, or null when the model can't
 * confidently map the input to a real word. Errors surface as LLMError.
 */
export async function suggestSpelling(term: string): Promise<Result<string | null, LLMError>> {
    if (!process.env.DEEPSEEK_API_KEY) return err({ kind: 'no_fallback_available' })

    const result = await callDeepSeek({
        system: CORRECTION_SYSTEM,
        user: term,
        maxTokens: 20,
    })
    if (!result.ok) return err(result.error)

    let parsed: unknown
    try {
        parsed = JSON.parse(result.value)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    const validated = correctionLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })

    return ok(validated.data.correction)
}

export async function extractCandidates(text: string): Promise<Result<string[], LLMError>> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) return err({ kind: 'no_fallback_available' })

    const first = await tryExtract(text)
    if (first.ok) return first

    // One retry with stricter system prompt — handles real-world paragraphs where DeepSeek's
    // initial output drifts from the schema (extra fields, wrapped in markdown, etc.)
    if (first.error.kind === 'malformed_llm_response') {
        const retry = await tryExtract(text, true)
        if (retry.ok) return retry
        return first
    }
    return first
}

async function tryExtract(text: string, strict = false): Promise<Result<string[], LLMError>> {
    const system = strict
        ? `${EXTRACT_SYSTEM} CRITICAL: your previous attempt was rejected. Output ONLY the JSON object {"terms":[...]} with no other characters before or after.`
        : EXTRACT_SYSTEM

    const result = await callDeepSeek({ system, user: text, maxTokens: EXTRACT_MAX_TOKENS })
    if (!result.ok) return err(result.error)

    let parsed: unknown
    try {
        parsed = JSON.parse(result.value)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    const validated = extractLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })

    const terms = [...new Set(validated.data.terms.map(t => t.trim().toLowerCase()).filter(Boolean))].slice(0, 15)
    return ok(terms)
}

export async function generateScenario(
    term: string,
    definition: string,
): Promise<Result<{ scenario: string; channel: 'irl' | 'text' }, LLMError>> {
    if (!process.env.DEEPSEEK_API_KEY) return err({ kind: 'no_fallback_available' })

    const result = await callDeepSeek({
        system: SCENARIO_SYSTEM,
        user: `Word: ${term}\nDefinition: ${definition}`,
        maxTokens: 120,
    })
    if (!result.ok) return err(result.error)

    let parsed: unknown
    try {
        parsed = JSON.parse(result.value)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    const validated = scenarioLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })

    return ok(validated.data)
}

export async function judgeUsage(
    term: string,
    definition: string,
    sentence: string,
): Promise<Result<{ correct: boolean; reason: string }, LLMError>> {
    if (!process.env.DEEPSEEK_API_KEY) return err({ kind: 'no_fallback_available' })

    const result = await callDeepSeek({
        system: JUDGE_SYSTEM,
        user: `Word: ${term}\nDefinition: ${definition}\nLearner's sentence: ${sentence}`,
        maxTokens: 120,
    })
    if (!result.ok) return err(result.error)

    let parsed: unknown
    try {
        parsed = JSON.parse(result.value)
    } catch {
        return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })
    }

    const validated = judgeLLMSchema.safeParse(parsed)
    if (!validated.success) return err({ kind: 'malformed_llm_response', raw: result.value.slice(0, 200) })

    return ok(validated.data)
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
