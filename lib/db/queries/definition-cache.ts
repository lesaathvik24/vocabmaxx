import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '../client'
import { definitionCache } from '../schema'

export interface CachedDefinition {
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
}

export async function lookup(term: string): Promise<CachedDefinition | null> {
    const [row] = await db.select().from(definitionCache).where(eq(definitionCache.term, term)).limit(1)
    if (!row) return null
    return {
        definition: row.definition,
        examples: row.examples,
        source: row.source,
        phonetic: row.phonetic,
        audioUrl: row.audioUrl,
    }
}

export async function write(term: string, value: CachedDefinition): Promise<void> {
    await db
        .insert(definitionCache)
        .values({
            term,
            definition: value.definition,
            examples: value.examples,
            source: value.source,
            phonetic: value.phonetic,
            audioUrl: value.audioUrl,
        })
        .onConflictDoNothing({ target: definitionCache.term })
}
