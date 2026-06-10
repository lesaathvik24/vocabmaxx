import { z } from 'zod'

export const themeSchema = z.enum(['light', 'dark'])

export const preferencesPatchSchema = z
    .object({
        displayName: z.string().trim().max(80).nullable().optional(),
        theme: themeSchema.optional(),
        dailyDigest: z.boolean().optional(),
        digestHour: z.number().int().min(0).max(23).optional(),
    })
    .refine(
        (b) =>
            b.displayName !== undefined ||
            b.theme !== undefined ||
            b.dailyDigest !== undefined ||
            b.digestHour !== undefined,
        { message: 'at least one preference field is required' },
    )

export type PreferencesPatch = z.infer<typeof preferencesPatchSchema>
