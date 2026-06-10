import 'server-only'
import * as prefsQ from '@/lib/db/queries/preferences'
import * as srsQ from '@/lib/db/queries/srs'
import { createAdminClient } from '@/lib/auth/admin'
import { sendDailyDigest } from './email.service'

const SAMPLE_SIZE = 5

export interface DigestDeps {
    /** Users opted into the digest at this UTC hour. */
    listRecipients(hour: number): Promise<{ userId: string }[]>
    /** Count of words due for this user as of `now`. */
    countDue(userId: string, now: Date): Promise<number>
    /** A few due terms to tease in the email. */
    sampleDueTerms(userId: string, now: Date, limit: number): Promise<string[]>
    /** Resolve a user's email address (null if unknown). */
    resolveEmail(userId: string): Promise<string | null>
    /** Send the digest; resolves to whether it was accepted. */
    sendDigest(to: string, count: number, sampleWords: string[]): Promise<{ ok: boolean }>
}

const defaultDeps: DigestDeps = {
    listRecipients: (hour) => prefsQ.listDigestRecipients(hour),
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
}

export interface DigestResult {
    hour: number
    considered: number
    sent: number
    skippedNoneDue: number
    skippedNoEmail: number
    failed: number
}

/**
 * Run the daily digest for whichever UTC hour `now` falls in: for each opted-in
 * recipient with words due, render and send their digest. Per-user failures are
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

    return result
}
