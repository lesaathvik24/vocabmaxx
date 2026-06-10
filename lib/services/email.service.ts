import 'server-only'
import { Resend } from 'resend'

export interface DigestData {
    count: number
    sampleWords: string[]
    displayName?: string | null
}

export interface EmailContent {
    subject: string
    html: string
    text: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabmaxx.com'
const FROM = process.env.EMAIL_FROM ?? 'VocabMaxx <digest@vocabmaxx.com>'

/**
 * Build the daily-digest email. Pure (no network) so it can be unit-tested and
 * previewed. `count` is the number of words due; `sampleWords` seeds a teaser list.
 */
export function dailyDigestTemplate(data: DigestData): EmailContent {
    const { count, sampleWords, displayName } = data
    const greetingText = displayName ? `Hi ${displayName},` : 'Hi,'
    const greetingHtml = displayName ? `Hi ${escapeHtml(displayName)},` : 'Hi,'
    const noun = count === 1 ? 'word' : 'words'
    const subject = `${count} ${noun} due for review on VocabMaxx`
    const reviewUrl = `${APP_URL}/review`

    const sample = sampleWords.slice(0, 5)
    const sampleText =
        sample.length > 0 ? `\nA few of them: ${sample.join(', ')}.\n` : ''
    const sampleHtml =
        sample.length > 0
            ? `<p style="color:#555">A few of them: ${sample
                  .map((w) => `<strong>${escapeHtml(w)}</strong>`)
                  .join(', ')}.</p>`
            : ''

    const text = `${greetingText}

You have ${count} ${noun} due for review.
${sampleText}
Review now: ${reviewUrl}

— VocabMaxx`

    const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
  <p>${greetingHtml}</p>
  <p>You have <strong>${count}</strong> ${noun} due for review.</p>
  ${sampleHtml}
  <p><a href="${reviewUrl}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none">Review now</a></p>
  <p style="color:#888;font-size:12px">— VocabMaxx</p>
</div>`

    return { subject, html, text }
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export interface SendResult {
    ok: boolean
    error?: string
}

let _resend: Resend | undefined
function resend(): Resend {
    if (!_resend) {
        const key = process.env.RESEND_API_KEY
        if (!key) throw new Error('RESEND_API_KEY is not set')
        _resend = new Resend(key)
    }
    return _resend
}

/** Send a pre-rendered email via Resend. */
export async function sendEmail(to: string, content: EmailContent): Promise<SendResult> {
    const { error } = await resend().emails.send({
        from: FROM,
        to,
        subject: content.subject,
        html: content.html,
        text: content.text,
    })
    return error ? { ok: false, error: error.message } : { ok: true }
}

export async function sendDailyDigest(to: string, data: DigestData): Promise<SendResult> {
    return sendEmail(to, dailyDigestTemplate(data))
}
