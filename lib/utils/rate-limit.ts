import 'server-only'

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
