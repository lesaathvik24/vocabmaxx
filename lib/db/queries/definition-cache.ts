import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '../client'
import { definitionCache } from '../schema'
import type { Sense } from '@/lib/domain/word'

export interface CachedDefinition {
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
    senses: Sense[]
}

export async function lookup(term: string): Promise<CachedDefinition | null> {
    const [row] = await db.select().from(definitionCache).where(eq(definitionCache.term, term)).limit(1)
    if (!row) return null

    // Dictionary rows written before multi-sense support can hold a definition
    // and examples describing *different* meanings (the old parser took the
    // first definition but harvested examples from any sense). Treat them as a
    // miss so they are refetched and overwritten, rather than served forever.
    if (row.source === 'dictionary' && !row.senses) return null

    return {
        definition: row.definition,
        examples: row.examples,
        source: row.source,
        phonetic: row.phonetic,
        audioUrl: row.audioUrl,
        // LLM rows predating senses were always self-consistent — one meaning,
        // its own examples — so a synthesised single sense is faithful.
        senses: row.senses ?? [
            { partOfSpeech: null, definition: row.definition, examples: row.examples },
        ],
    }
}

/** Upsert: a refetched term overwrites its stale cache row. */
export async function write(term: string, value: CachedDefinition): Promise<void> {
    const fields = {
        definition: value.definition,
        examples: value.examples,
        source: value.source,
        phonetic: value.phonetic,
        audioUrl: value.audioUrl,
        senses: value.senses,
    }
    await db
        .insert(definitionCache)
        .values({ term, ...fields })
        .onConflictDoUpdate({ target: definitionCache.term, set: fields })
}
