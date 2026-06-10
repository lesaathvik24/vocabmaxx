import 'server-only'
import { type Result, ok, err, type ImportError } from '@/lib/domain/errors'
import { extractCandidates } from './llm.client'
import * as wordService from './word.service'
import * as definitionService from './definition.service'

const MAX_TEXT_LEN = 5000
const MAX_TERMS = 200
const MAX_TERM_LEN = 64
const SAVE_BUDGET_MS = 50_000

export interface BulkImportSummary {
    added: number
    skipped: number
    failed: number
    addedTerms: string[]
}

export interface ExtractDeps {
    llmExtract: typeof extractCandidates
}

const defaultExtractDeps: ExtractDeps = { llmExtract: extractCandidates }

export async function extract(
    text: string,
    deps: ExtractDeps = defaultExtractDeps,
): Promise<Result<string[], ImportError>> {
    const trimmed = text.trim()
    if (trimmed.length === 0 || trimmed.length > MAX_TEXT_LEN) {
        return err({ kind: 'invalid_input', message: `text must be 1..${MAX_TEXT_LEN} characters` })
    }

    const result = await deps.llmExtract(trimmed)
    if (!result.ok) {
        const e = result.error
        if (e.kind === 'rate_limited') return err({ kind: 'rate_limited' })
        if (e.kind === 'no_fallback_available') return err({ kind: 'network_failure', cause: 'LLM unavailable' })
        if (e.kind === 'network_failure') return err({ kind: 'network_failure', cause: e.cause })
        return err({ kind: 'malformed_llm_response', raw: e.raw })
    }

    const terms = [...new Set(result.value.map(c => c.term.toLowerCase()))].slice(0, 15)
    return ok(terms)
}

export interface SaveBulkDeps {
    wordSave: typeof wordService.save
    defFetch: typeof definitionService.fetchDefinition
}

const defaultSaveDeps: SaveBulkDeps = {
    wordSave: wordService.save,
    defFetch: definitionService.fetchDefinition,
}

export async function saveBulk(
    userId: string,
    terms: string[],
    deps: SaveBulkDeps = defaultSaveDeps,
): Promise<Result<BulkImportSummary, ImportError>> {
    const trimmed = terms.map(t => t.trim()).filter(t => t.length > 0 && t.length <= MAX_TERM_LEN)

    if (trimmed.length === 0 || trimmed.length > MAX_TERMS) {
        return err({ kind: 'invalid_input', message: `terms must be 1..${MAX_TERMS} valid entries` })
    }

    let added = 0
    let skipped = 0
    let failed = 0
    const addedTerms: string[] = []
    const startedAt = Date.now()

    // Sequential — not parallel — because DeepSeek LLM fallback has rate limits per the definition pipeline.
    // Wall-clock budget — abort remaining as `failed` so serverless function doesn't time out mid-write.
    for (const term of trimmed) {
        if (Date.now() - startedAt > SAVE_BUDGET_MS) {
            failed += trimmed.length - (added + skipped + failed)
            break
        }
        const defResult = await deps.defFetch(term)
        if (!defResult.ok) {
            failed++
            continue
        }

        const saveResult = await deps.wordSave({
            userId,
            term: defResult.value.term,
            definition: defResult.value.def.definition,
            examples: defResult.value.def.examples,
            source: defResult.value.def.source,
        })

        if (!saveResult.ok) {
            if (saveResult.error.kind === 'duplicate_term') {
                skipped++
            } else {
                failed++
            }
        } else {
            added++
            addedTerms.push(saveResult.value.term)
        }
    }

    return ok({ added, skipped, failed, addedTerms })
}
