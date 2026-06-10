import 'server-only'
import * as wordsQ from '@/lib/db/queries/words'
import type { ExportRow } from '@/lib/db/queries/words'

export type { ExportRow }

export interface ExportDeps {
    listForExport(userId: string): Promise<ExportRow[]>
}

const defaultDeps: ExportDeps = {
    listForExport: wordsQ.listForExport,
}

// ---------------------------------------------------------------------------
// Pure formatters (no DB) — unit-tested directly.
// ---------------------------------------------------------------------------

/** RFC-4180 cell escaping: wrap in quotes when the value holds a comma, quote, or newline. */
export function csvCell(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

export const CSV_HEADER = [
    'term',
    'definition',
    'examples',
    'source',
    'added_at',
    'ease_factor',
    'interval_days',
    'repetitions',
    'due_date',
    'last_reviewed_at',
] as const

/** Examples join with ` | ` so the CSV stays human/Excel-readable and reversible. */
export const EXAMPLE_SEP = ' | '

function iso(d: Date | null): string {
    return d ? d.toISOString() : ''
}

function num(n: number | null): string {
    return n === null ? '' : String(n)
}

export function toCSV(rows: ExportRow[]): string {
    const lines = [CSV_HEADER.join(',')]
    for (const r of rows) {
        lines.push(
            [
                r.term,
                r.definition,
                r.examples.join(EXAMPLE_SEP),
                r.source,
                iso(r.addedAt),
                num(r.easeFactor),
                num(r.intervalDays),
                num(r.repetitions),
                iso(r.dueDate),
                iso(r.lastReviewedAt),
            ]
                .map((v) => csvCell(String(v)))
                .join(','),
        )
    }
    // Trailing newline so the file ends cleanly (POSIX text convention).
    return lines.join('\n') + '\n'
}

export interface ExportJSON {
    version: 1
    exportedAt: string
    count: number
    words: {
        term: string
        definition: string
        examples: string[]
        source: ExportRow['source']
        addedAt: string
        srs: {
            easeFactor: number
            intervalDays: number
            repetitions: number
            dueDate: string
            lastReviewedAt: string | null
        } | null
    }[]
}

export function toJSON(rows: ExportRow[], now: Date = new Date()): string {
    const payload: ExportJSON = {
        version: 1,
        exportedAt: now.toISOString(),
        count: rows.length,
        words: rows.map((r) => ({
            term: r.term,
            definition: r.definition,
            examples: r.examples,
            source: r.source,
            addedAt: r.addedAt.toISOString(),
            srs:
                r.dueDate !== null
                    ? {
                          easeFactor: r.easeFactor ?? 0,
                          intervalDays: r.intervalDays ?? 0,
                          repetitions: r.repetitions ?? 0,
                          dueDate: r.dueDate.toISOString(),
                          lastReviewedAt: r.lastReviewedAt ? r.lastReviewedAt.toISOString() : null,
                      }
                    : null,
        })),
    }
    return JSON.stringify(payload, null, 2)
}

// ---------------------------------------------------------------------------
// Service surface (DB-backed).
// ---------------------------------------------------------------------------

export async function asJSON(userId: string, deps: ExportDeps = defaultDeps): Promise<string> {
    const rows = await deps.listForExport(userId)
    return toJSON(rows)
}

export async function asCSV(userId: string, deps: ExportDeps = defaultDeps): Promise<string> {
    const rows = await deps.listForExport(userId)
    return toCSV(rows)
}
