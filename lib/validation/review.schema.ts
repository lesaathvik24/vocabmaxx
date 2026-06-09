import { z } from 'zod'

export const gradeSchema = z.object({
    wordId: z.string().uuid(),
    grade: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
})
export type GradeInput = z.infer<typeof gradeSchema>
