import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runDailyDigest, type DigestDeps } from '@/lib/services/digest.service'
import { dailyDigestTemplate } from '@/lib/services/email.service'

function makeDeps(over: Partial<DigestDeps> = {}): DigestDeps {
    return {
        listRecipients: vi.fn().mockResolvedValue([]),
        countDue: vi.fn().mockResolvedValue(0),
        sampleDueTerms: vi.fn().mockResolvedValue([]),
        resolveEmail: vi.fn().mockResolvedValue('user@example.com'),
        sendDigest: vi.fn().mockResolvedValue({ ok: true }),
        ...over,
    }
}

beforeEach(() => vi.clearAllMocks())

describe('runDailyDigest', () => {
    const now = new Date('2026-06-10T14:30:00Z') // 14:00 UTC hour

    it('queries recipients for the current UTC hour', async () => {
        const listRecipients = vi.fn().mockResolvedValue([])
        await runDailyDigest(now, makeDeps({ listRecipients }))
        expect(listRecipients).toHaveBeenCalledWith(14)
    })

    it('sends to a recipient who has words due', async () => {
        const sendDigest = vi.fn().mockResolvedValue({ ok: true })
        const result = await runDailyDigest(
            now,
            makeDeps({
                listRecipients: vi.fn().mockResolvedValue([{ userId: 'u1' }]),
                countDue: vi.fn().mockResolvedValue(3),
                sampleDueTerms: vi.fn().mockResolvedValue(['a', 'b']),
                sendDigest,
            }),
        )
        expect(sendDigest).toHaveBeenCalledWith('user@example.com', 3, ['a', 'b'])
        expect(result.sent).toBe(1)
        expect(result.considered).toBe(1)
    })

    it('skips a recipient with nothing due (no email sent)', async () => {
        const sendDigest = vi.fn().mockResolvedValue({ ok: true })
        const result = await runDailyDigest(
            now,
            makeDeps({
                listRecipients: vi.fn().mockResolvedValue([{ userId: 'u1' }]),
                countDue: vi.fn().mockResolvedValue(0),
                sendDigest,
            }),
        )
        expect(sendDigest).not.toHaveBeenCalled()
        expect(result.skippedNoneDue).toBe(1)
        expect(result.sent).toBe(0)
    })

    it('skips a recipient whose email cannot be resolved', async () => {
        const result = await runDailyDigest(
            now,
            makeDeps({
                listRecipients: vi.fn().mockResolvedValue([{ userId: 'u1' }]),
                countDue: vi.fn().mockResolvedValue(2),
                resolveEmail: vi.fn().mockResolvedValue(null),
            }),
        )
        expect(result.skippedNoEmail).toBe(1)
    })

    it('isolates a per-user failure and keeps processing the batch', async () => {
        const result = await runDailyDigest(
            now,
            makeDeps({
                listRecipients: vi.fn().mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]),
                countDue: vi.fn().mockResolvedValue(1),
                sendDigest: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('smtp down'))
                    .mockResolvedValueOnce({ ok: true }),
            }),
        )
        expect(result.failed).toBe(1)
        expect(result.sent).toBe(1)
        expect(result.considered).toBe(2)
    })

    it('counts a rejected send (ok:false) as failed', async () => {
        const result = await runDailyDigest(
            now,
            makeDeps({
                listRecipients: vi.fn().mockResolvedValue([{ userId: 'u1' }]),
                countDue: vi.fn().mockResolvedValue(1),
                sendDigest: vi.fn().mockResolvedValue({ ok: false }),
            }),
        )
        expect(result.failed).toBe(1)
        expect(result.sent).toBe(0)
    })
})

describe('dailyDigestTemplate', () => {
    it('pluralises and includes the count in the subject', () => {
        expect(dailyDigestTemplate({ count: 1, sampleWords: [] }).subject).toContain('1 word due')
        expect(dailyDigestTemplate({ count: 4, sampleWords: [] }).subject).toContain('4 words due')
    })

    it('greets by display name when provided', () => {
        const c = dailyDigestTemplate({ count: 2, sampleWords: [], displayName: 'Ada' })
        expect(c.text).toContain('Hi Ada,')
        expect(c.html).toContain('Hi Ada,')
    })

    it('lists up to 5 sample words and escapes html', () => {
        const c = dailyDigestTemplate({
            count: 9,
            sampleWords: ['a', 'b', 'c', 'd', 'e', 'f'],
            displayName: '<b>',
        })
        expect(c.text).toContain('a, b, c, d, e')
        expect(c.text).not.toContain(', f')
        expect(c.html).toContain('&lt;b&gt;')
    })

    it('omits the sample line when there are no sample words', () => {
        const c = dailyDigestTemplate({ count: 3, sampleWords: [] })
        expect(c.text).not.toContain('A few of them')
    })
})
