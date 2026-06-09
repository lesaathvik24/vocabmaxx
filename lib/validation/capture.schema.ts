import { z } from 'zod'

export const captureSchema = z.object({
    term: z.string().min(1).max(64).regex(/^[A-Za-z][A-Za-z'-]*$/),
})
export type CaptureInput = z.infer<typeof captureSchema>
