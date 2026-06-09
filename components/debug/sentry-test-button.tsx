'use client'

export function SentryTestButton() {
    return (
        <button
            className="text-xs text-red-400 underline mt-4"
            onClick={() => { throw new Error('Sentry test — VocabMaxx Phase 0') }}
        >
            Throw test error (Sentry)
        </button>
    )
}
