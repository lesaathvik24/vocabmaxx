import { z } from 'zod'

export const submitSidequestSchema = z.object({
    questId: z.string().uuid(),
    sentence: z.string().trim().min(1).max(500),
})
export type SubmitSidequestInput = z.infer<typeof submitSidequestSchema>
