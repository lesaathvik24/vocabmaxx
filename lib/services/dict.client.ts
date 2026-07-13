import 'server-only'
import { type Result, ok, err, type DefinitionError } from '@/lib/domain/errors'
import type { Sense } from '@/lib/domain/word'

export interface DefinitionResult {
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
    senses: Sense[]
}

const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const TIMEOUT_MS = 5000
const MAX_SENSES = 5
const MAX_EXAMPLES_PER_SENSE = 2

interface DictMeaning {
    partOfSpeech?: string
    definitions: { definition: string; example?: string }[]
}
interface DictPhonetic {
    text?: string
    audio?: string
}
interface DictEntry {
    phonetic?: string
    phonetics?: DictPhonetic[]
    meanings: DictMeaning[]
}

/** First usable phonetic text and audio URL across all entries (they may live in different items). */
export function pickPhonetics(entries: DictEntry[]): { phonetic: string | null; audioUrl: string | null } {
    let phonetic: string | null = null
    let audioUrl: string | null = null
    for (const entry of entries) {
        if (!phonetic && entry.phonetic) phonetic = entry.phonetic
        for (const p of entry.phonetics ?? []) {
            if (!phonetic && p.text) phonetic = p.text
            if (!audioUrl && p.audio && p.audio.startsWith('https://')) audioUrl = p.audio
            if (phonetic && audioUrl) return { phonetic, audioUrl }
        }
    }
    return { phonetic, audioUrl }
}

export async function fetchDefinition(term: string): Promise<Result<DefinitionResult, DefinitionError>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let res: Response
    try {
        res = await fetch(`${ENDPOINT}/${encodeURIComponent(term)}`, {
            signal: controller.signal,
            headers: { accept: 'application/json' },
        })
    } catch (e) {
        return err({ kind: 'network_failure', cause: e instanceof Error ? e.message : String(e) })
    } finally {
        clearTimeout(timer)
    }

    if (res.status === 404) return err({ kind: 'not_found' })
    if (!res.ok) return err({ kind: 'network_failure', cause: `dict status ${res.status}` })

    let body: unknown
    try {
        body = await res.json()
    } catch {
        return err({ kind: 'network_failure', cause: 'dict body not json' })
    }

    if (!Array.isArray(body) || body.length === 0) return err({ kind: 'not_found' })

    const entries = body as DictEntry[]
    const senses = rankSenses(collectSenses(entries))

    // The primary sense must carry its own example, so the definition and the
    // examples always describe the same meaning.
    const primary = senses.find((s) => s.examples.length > 0)
    if (!primary) return err({ kind: 'not_found' })

    const ordered = [primary, ...senses.filter((s) => s !== primary)].slice(0, MAX_SENSES)

    return ok({
        definition: primary.definition,
        examples: primary.examples,
        senses: ordered,
        source: 'dictionary',
        ...pickPhonetics(entries),
    })
}

/** Flatten every (part of speech, definition, examples) triple across all entries. */
export function collectSenses(entries: DictEntry[]): Sense[] {
    const senses: Sense[] = []
    for (const entry of entries) {
        for (const meaning of entry.meanings ?? []) {
            for (const def of meaning.definitions ?? []) {
                if (!def.definition) continue
                senses.push({
                    partOfSpeech: meaning.partOfSpeech ?? null,
                    definition: def.definition,
                    examples: def.example ? [def.example].slice(0, MAX_EXAMPLES_PER_SENSE) : [],
                })
            }
        }
    }
    return senses
}

/** Usage labels the dictionary prefixes onto a definition, e.g. "(archaic) ...". */
const RARE_MARKERS = /\((archaic|obsolete|dated|rare|historical|poetic|dialect\w*)\)/i
const QUALIFIED_MARKER = /^\s*\(/

/**
 * Order senses by how likely they are to be the meaning someone actually wants.
 *
 * dictionaryapi.dev lists senses in etymological order, not by frequency — for
 * "flustered" the first sense is the archaic "to make hot and rosy, as with
 * drinking", which is not what anyone means today. So we score instead of
 * trusting the order: a sense earns points for carrying a usage example (the
 * dictionary only bothers to illustrate senses that are actually used), and
 * loses them for being tagged archaic/obsolete/rare or otherwise qualified.
 * Ties fall back to the original order.
 */
export function rankSenses(senses: Sense[]): Sense[] {
    return senses
        .map((sense, index) => ({ sense, index, score: scoreSense(sense, index) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((s) => s.sense)
}

function scoreSense(sense: Sense, index: number): number {
    let score = 0
    if (sense.examples.length > 0) score += 10
    if (RARE_MARKERS.test(sense.definition)) score -= 20
    else if (QUALIFIED_MARKER.test(sense.definition)) score -= 2
    // Gentle nudge toward the dictionary's own ordering, never enough to
    // outweigh an example or a rarity penalty.
    score -= index * 0.1
    return score
}
