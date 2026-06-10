import { z } from 'zod'

/**
 * The single source of truth for a valid capture term: one word, letters plus
 * internal apostrophes/hyphens. Case-insensitive so it matches both raw user
 * input (this schema) and the lowercased term in the definition pipeline.
 */
export const TERM_PATTERN = /^[a-z][a-z'-]*$/i

export const captureSchema = z.object({
    term: z.string().min(1).max(64).regex(TERM_PATTERN),
})
export type CaptureInput = z.infer<typeof captureSchema>
