import 'server-only'
import webpush from 'web-push'
import * as pushQ from '@/lib/db/queries/push-subscriptions'

export interface PushPayload {
    title: string
    body: string
    url: string
}

let configured = false

export function isPushConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

function ensureConfigured(): boolean {
    if (configured) return true
    if (!isPushConfigured()) return false
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT ?? 'mailto:notifications@vocabmaxx.app',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!,
    )
    configured = true
    return true
}

function isGone(e: unknown): boolean {
    const code = (e as { statusCode?: number })?.statusCode
    return code === 404 || code === 410
}

/**
 * Send a push to every subscription a user has. Expired endpoints (404/410)
 * are pruned; other per-endpoint failures are tallied, never thrown.
 */
export async function sendToUser(
    userId: string,
    payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
    if (!ensureConfigured()) return { sent: 0, failed: 0 }

    const subs = await pushQ.listByUser(userId)
    let sent = 0
    let failed = 0

    for (const sub of subs) {
        try {
            await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify(payload),
                { TTL: 12 * 60 * 60 },
            )
            sent++
        } catch (e) {
            if (isGone(e)) {
                await pushQ.removeStale(sub.endpoint).catch(() => undefined)
            } else {
                failed++
            }
        }
    }

    return { sent, failed }
}

export function duePushPayload(count: number, sampleWords: string[]): PushPayload {
    const teaser = sampleWords.length > 0 ? ` — ${sampleWords.slice(0, 3).join(', ')}…` : ''
    return {
        title: count === 1 ? '1 word due for review' : `${count} words due for review`,
        body: `Keep your streak alive${teaser}`,
        url: '/review',
    }
}
