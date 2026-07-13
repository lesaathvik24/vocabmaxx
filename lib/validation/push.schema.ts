import { z } from 'zod'

export const pushSubscribeSchema = z.object({
    endpoint: z.string().url().max(1024),
    keys: z.object({
        p256dh: z.string().min(1).max(256),
        auth: z.string().min(1).max(128),
    }),
})

export const pushUnsubscribeSchema = z.object({
    endpoint: z.string().url().max(1024),
})

export type PushSubscribeBody = z.infer<typeof pushSubscribeSchema>
