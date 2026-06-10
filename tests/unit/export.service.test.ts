import { describe, it, expect, vi } from 'vitest'
import {
    csvCell,
    toCSV,
    toJSON,
    asJSON,
    asCSV,
    CSV_HEADER,
    EXAMPLE_SEP,
    type ExportRow,
    type ExportDeps,
} from '@/lib/services/export.service'

function makeRow(overrides: Partial<ExportRow> = {}): ExportRow {
    return {
        id: 'w1',
        userId: 'u1',
        term: 'ephemeral',
        definition: 'lasting a very short time',
        examples: ['an ephemeral fashion', 'ephemeral pleasures'],
        source: 'dictionary',
        addedAt: new Date('2026-06-01T10:00:00Z'),
        easeFactor: 2.5,
        intervalDays: 3,
        repetitions: 2,
        dueDate: new Date('2026-06-05T10:00:00Z'),
        lastReviewedAt: new Date('2026-06-02T10:00:00Z'),
        ...overrides,
    }
}

describe('csvCell', () => {
    it('leaves plain values untouched', () => {
        expect(csvCell('hello')).toBe('hello')
    })

    it('quotes values containing a comma', () => {
        expect(csvCell('a, b')).toBe('"a, b"')
    })

    it('quotes and doubles embedded quotes', () => {
        expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    })

    it('quotes values containing newlines', () => {
        expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
    })
})

describe('toCSV', () => {
    it('emits the header row first', () => {
        const csv = toCSV([])
        expect(csv.split('\n')[0]).toBe(CSV_HEADER.join(','))
    })

    it('produces one data line per word (plus header)', () => {
        const csv = toCSV([makeRow(), makeRow({ term: 'lucid' })])
        const lines = csv.trimEnd().split('\n')
        expect(lines).toHaveLength(3) // header + 2 rows
    })

    it('joins examples with the documented separator', () => {
        const csv = toCSV([makeRow()])
        expect(csv).toContain(`an ephemeral fashion${EXAMPLE_SEP}ephemeral pleasures`)
    })

    it('escapes a definition containing a comma', () => {
        const csv = toCSV([makeRow({ definition: 'short, fleeting' })])
        expect(csv).toContain('"short, fleeting"')
    })

    it('renders empty cells for missing SRS state', () => {
        const csv = toCSV([
            makeRow({
                easeFactor: null,
                intervalDays: null,
                repetitions: null,
                dueDate: null,
                lastReviewedAt: null,
            }),
        ])
        const dataLine = csv.trimEnd().split('\n')[1]
        // term,definition,examples,source,added_at, then 5 empty SRS cells
        expect(dataLine.endsWith(',,,,,')).toBe(true)
    })

    it('ends with a trailing newline', () => {
        expect(toCSV([makeRow()]).endsWith('\n')).toBe(true)
    })
})

describe('toJSON', () => {
    it('wraps words with version + count + exportedAt', () => {
        const now = new Date('2026-06-10T12:00:00Z')
        const parsed = JSON.parse(toJSON([makeRow()], now))
        expect(parsed.version).toBe(1)
        expect(parsed.count).toBe(1)
        expect(parsed.exportedAt).toBe('2026-06-10T12:00:00.000Z')
        expect(parsed.words[0].term).toBe('ephemeral')
        expect(parsed.words[0].srs.repetitions).toBe(2)
    })

    it('serialises srs as null when the word has no SRS row', () => {
        const parsed = JSON.parse(toJSON([makeRow({ dueDate: null })]))
        expect(parsed.words[0].srs).toBeNull()
    })

    it('round-trips example arrays exactly', () => {
        const parsed = JSON.parse(toJSON([makeRow()]))
        expect(parsed.words[0].examples).toEqual(['an ephemeral fashion', 'ephemeral pleasures'])
    })
})

describe('service surface (injected deps)', () => {
    it('asCSV row count matches the source rows (round-trip count guarantee)', async () => {
        const rows = [makeRow(), makeRow({ term: 'lucid' }), makeRow({ term: 'terse' })]
        const deps: ExportDeps = { listForExport: vi.fn().mockResolvedValue(rows) }
        const csv = await asCSV('u1', deps)
        const dataLines = csv.trimEnd().split('\n').slice(1)
        expect(dataLines).toHaveLength(rows.length)
    })

    it('asJSON count matches the source rows', async () => {
        const rows = [makeRow(), makeRow({ term: 'lucid' })]
        const deps: ExportDeps = { listForExport: vi.fn().mockResolvedValue(rows) }
        const parsed = JSON.parse(await asJSON('u1', deps))
        expect(parsed.count).toBe(2)
        expect(parsed.words).toHaveLength(2)
    })
})
