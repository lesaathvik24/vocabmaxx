import { z } from 'zod'

export const extractRequestSchema = z.object({
    mode: z.literal('extract'),
    text: z.string().min(1).max(5000),
})

export const saveRequestSchema = z.object({
    mode: z.literal('save'),
    terms: z.array(z.string().trim().min(1).max(64)).min(1).max(200),
})

export const importRequestSchema = z.discriminatedUnion('mode', [extractRequestSchema, saveRequestSchema])

export type ExtractRequest = z.infer<typeof extractRequestSchema>
export type SaveRequest = z.infer<typeof saveRequestSchema>
export type ImportRequest = z.infer<typeof importRequestSchema>
