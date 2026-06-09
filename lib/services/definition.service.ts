import 'server-only'
import { type Result, ok, err, type DefinitionError, type CaptureError } from '@/lib/domain/errors'
import * as cache from '@/lib/db/queries/definition-cache'
import { fetchDefinition as fetchFromDict, type DefinitionResult } from './dict.client'
import { fetchLLMDefinition } from './llm.client'

const TERM_RE = /^[a-z][a-z'-]*$/

export interface DefinitionDeps {
    cacheLookup: typeof cache.lookup
    cacheWrite: typeof cache.write
    dict: typeof fetchFromDict
    llm: typeof fetchLLMDefinition
}

const defaultDeps: DefinitionDeps = {
    cacheLookup: cache.lookup,
    cacheWrite: cache.write,
    dict: fetchFromDict,
    llm: fetchLLMDefinition,
}

export async function fetchDefinition(
    rawTerm: string,
    deps: DefinitionDeps = defaultDeps,
): Promise<Result<{ term: string; def: DefinitionResult }, CaptureError>> {
    const term = rawTerm.trim().toLowerCase()
    if (!TERM_RE.test(term)) return err({ kind: 'invalid_term' })

    const cached = await deps.cacheLookup(term)
    if (cached) return ok({ term, def: { ...cached } })

    const dictResult = await deps.dict(term)
    if (dictResult.ok) {
        await deps.cacheWrite(term, dictResult.value).catch(() => undefined)
        return ok({ term, def: dictResult.value })
    }

    if (!shouldFallback(dictResult.error)) return err(dictResult.error)

    const llmResult = await deps.llm(term)
    if (llmResult.ok) {
        await deps.cacheWrite(term, llmResult.value).catch(() => undefined)
        return ok({ term, def: llmResult.value })
    }
    return err(llmResult.error)
}

function shouldFallback(e: DefinitionError): boolean {
    return e.kind === 'not_found' || e.kind === 'network_failure'
}
