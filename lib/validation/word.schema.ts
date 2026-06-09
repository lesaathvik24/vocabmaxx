import { z } from 'zod'

export const editWordSchema = z.object({
    definition: z.string().min(1).max(500).optional(),
    examples: z.array(z.string().min(1).max(300)).min(1).max(3).optional(),
}).refine(d => d.definition || d.examples, 'at least one field required')
export type EditWordInput = z.infer<typeof editWordSchema>
