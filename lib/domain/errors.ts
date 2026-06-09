export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export type DefinitionError =
    | { kind: 'not_found' }
    | { kind: 'no_fallback_available' }
    | { kind: 'malformed_llm_response'; raw: string }
    | { kind: 'network_failure'; cause: string }
    | { kind: 'rate_limited' }

export type CaptureError =
    | DefinitionError
    | { kind: 'duplicate_term' }
    | { kind: 'invalid_term' }

export type SRSError =
    | { kind: 'word_not_found' }
    | { kind: 'not_due'; nextDue: Date }

export class InvalidWordError extends Error {
    readonly kind = 'invalid_word' as const
    constructor(message: string) {
        super(message)
        this.name = 'InvalidWordError'
    }
}

export class InvalidSRSStateError extends Error {
    readonly kind = 'invalid_srs_state' as const
    constructor(message: string) {
        super(message)
        this.name = 'InvalidSRSStateError'
    }
}
