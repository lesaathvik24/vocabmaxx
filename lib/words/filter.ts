/**
 * Pure, client-safe helpers for the word list: SRS status derivation and the
 * search + filter logic. Kept dependency-free (no `server-only`, no DB) so it
 * can run in the browser and be unit-tested in isolation.
 */

export type WordStatus = 'new' | 'learning' | 'review' | 'mastered'
export type WordFilter = 'all' | 'due' | 'mastered'

/**
 * Map SRS repetition count to a coarse learning status. Mirrors the mapping in
 * `dashboard.service.repsToStatus` but lives here so client code can use it
 * without importing a `server-only` module.
 */
export function repsToStatus(reps: number): WordStatus {
    if (reps <= 0) return 'new'
    if (reps <= 3) return 'learning'
    if (reps <= 7) return 'review'
    return 'mastered'
}

export interface FilterableWord {
    term: string
    definition: string
    status: WordStatus
    /** True when the card's SRS due date is at or before "now". */
    due: boolean
}

/**
 * Apply the active filter (All / Due / Mastered) then a case-insensitive
 * substring search over term + definition. Pure — returns a new array.
 */
export function filterWords<T extends FilterableWord>(
    words: T[],
    opts: { query?: string; filter?: WordFilter } = {},
): T[] {
    const filter = opts.filter ?? 'all'
    const q = (opts.query ?? '').trim().toLowerCase()

    return words.filter((w) => {
        if (filter === 'due' && !w.due) return false
        if (filter === 'mastered' && w.status !== 'mastered') return false
        if (!q) return true
        return w.term.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q)
    })
}
