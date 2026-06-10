import 'server-only'

/**
 * In-memory token-bucket rate limiter — best-effort abuse/cost throttle.
 *
 * NOTE: the bucket map is per-process. On serverless (Vercel) each instance has
 * its own map, so a client spread across cold-started instances can exceed the
 * nominal limit. This is an intentional, documented limitation (see
 * docs/SECURITY.md §6); for hard guarantees, back this with a shared store
 * (e.g. Upstash Redis). It still meaningfully caps a single hot instance.
 */
interface Bucket {
    tokens: number
    updatedAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
    capacity: number
    refillPerSec: number
}

export function take(key: string, opts: RateLimitOptions): boolean {
    const now = Date.now()
    const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now }
    const elapsed = (now - b.updatedAt) / 1000
    b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec)
    b.updatedAt = now
    if (b.tokens < 1) {
        buckets.set(key, b)
        return false
    }
    b.tokens -= 1
    buckets.set(key, b)
    return true
}
