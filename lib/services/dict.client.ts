import 'server-only'
import { type Result, ok, err, type DefinitionError } from '@/lib/domain/errors'

export interface DefinitionResult {
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
}

const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const TIMEOUT_MS = 5000

interface DictMeaning {
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
    let definition: string | undefined
    const examples: string[] = []

    outer: for (const entry of entries) {
        for (const meaning of entry.meanings ?? []) {
            for (const def of meaning.definitions ?? []) {
                if (!definition && def.definition) definition = def.definition
                if (def.example) {
                    examples.push(def.example)
                    if (examples.length >= 2) break outer
                }
            }
        }
    }

    if (!definition || examples.length === 0) return err({ kind: 'not_found' })

    return ok({ definition, examples, source: 'dictionary', ...pickPhonetics(entries) })
}
