import 'server-only'
import * as prefsQ from '@/lib/db/queries/preferences'
import * as srsQ from '@/lib/db/queries/srs'
import * as pushQ from '@/lib/db/queries/push-subscriptions'
import { createAdminClient } from '@/lib/auth/admin'
import { sendDailyDigest } from './email.service'
import { sendToUser, duePushPayload, isPushConfigured } from './push.service'

const SAMPLE_SIZE = 5

export interface DigestDeps {
    /** Users opted into the email digest at this UTC hour. */
    listRecipients(hour: number): Promise<{ userId: string }[]>
    /** Users with at least one browser push subscription. */
    listPushRecipients(): Promise<{ userId: string }[]>
    /** Count of words due for this user as of `now`. */
    countDue(userId: string, now: Date): Promise<number>
    /** A few due terms to tease in the notification. */
    sampleDueTerms(userId: string, now: Date, limit: number): Promise<string[]>
    /** Resolve a user's email address (null if unknown). */
    resolveEmail(userId: string): Promise<string | null>
    /** Send the digest email; resolves to whether it was accepted. */
    sendDigest(to: string, count: number, sampleWords: string[]): Promise<{ ok: boolean }>
    /** Send a browser push to all of the user's devices. */
    sendPush(userId: string, count: number, sampleWords: string[]): Promise<{ sent: number; failed: number }>
    /** Whether VAPID keys are configured (skip the push pass when not). */
    pushConfigured(): boolean
}

const defaultDeps: DigestDeps = {
    listRecipients: (hour) => prefsQ.listDigestRecipients(hour),
    listPushRecipients: () => pushQ.listSubscribedUserIds(),
    countDue: (userId, now) => srsQ.countDue(userId, now),
    sampleDueTerms: async (userId, now, limit) => {
        const due = await srsQ.findDue(userId, now)
        return due.slice(0, limit).map((w) => w.term)
    },
    resolveEmail: async (userId) => {
        const admin = createAdminClient()
        const { data, error } = await admin.auth.admin.getUserById(userId)
        if (error || !data.user) return null
        return data.user.email ?? null
    },
    sendDigest: async (to, count, sampleWords) => {
        const res = await sendDailyDigest(to, { count, sampleWords })
        return { ok: res.ok }
    },
    sendPush: (userId, count, sampleWords) => sendToUser(userId, duePushPayload(count, sampleWords)),
    pushConfigured: isPushConfigured,
}

export interface DigestResult {
    hour: number
    considered: number
    sent: number
    skippedNoneDue: number
    skippedNoEmail: number
    failed: number
    pushConsidered: number
    pushSent: number
    pushFailed: number
}

/**
 * Run the daily digest for whichever UTC hour `now` falls in: for each opted-in
 * email recipient with words due, render and send their digest; then push to
 * every push-subscribed user with words due (push is per-device opt-in, so it
 * is not gated on the email preference or its hour). Per-user failures are
 * isolated (tallied, never abort the batch). Fully injectable for testing.
 */
export async function runDailyDigest(
    now: Date = new Date(),
    deps: DigestDeps = defaultDeps,
): Promise<DigestResult> {
    const hour = now.getUTCHours()
    const recipients = await deps.listRecipients(hour)

    const result: DigestResult = {
        hour,
        considered: recipients.length,
        sent: 0,
        skippedNoneDue: 0,
        skippedNoEmail: 0,
        failed: 0,
        pushConsidered: 0,
        pushSent: 0,
        pushFailed: 0,
    }

    for (const { userId } of recipients) {
        try {
            const count = await deps.countDue(userId, now)
            if (count <= 0) {
                result.skippedNoneDue++
                continue
            }
            const email = await deps.resolveEmail(userId)
            if (!email) {
                result.skippedNoEmail++
                continue
            }
            const sample = await deps.sampleDueTerms(userId, now, SAMPLE_SIZE)
            const { ok } = await deps.sendDigest(email, count, sample)
            if (ok) result.sent++
            else result.failed++
        } catch {
            result.failed++
        }
    }

    if (deps.pushConfigured()) {
        const pushRecipients = await deps.listPushRecipients()
        result.pushConsidered = pushRecipients.length
        for (const { userId } of pushRecipients) {
            try {
                const count = await deps.countDue(userId, now)
                if (count <= 0) continue
                const sample = await deps.sampleDueTerms(userId, now, SAMPLE_SIZE)
                const { sent, failed } = await deps.sendPush(userId, count, sample)
                result.pushSent += sent
                result.pushFailed += failed
            } catch {
                result.pushFailed++
            }
        }
    }

    return result
}
