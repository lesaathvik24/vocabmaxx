import { describe, it, expect } from 'vitest'
import { sanitizeNext } from '@/app/auth/callback/route'

const ORIGIN = 'https://app.vocabmaxx.com'

describe('sanitizeNext', () => {
    it('passes a plain dashboard path', () => {
        expect(sanitizeNext('/dashboard', ORIGIN)).toBe('/dashboard')
    })

    it('passes a path with query string', () => {
        expect(sanitizeNext('/words?filter=x', ORIGIN)).toBe('/words?filter=x')
    })

    it('rejects double-slash open redirect', () => {
        expect(sanitizeNext('//evil.com', ORIGIN)).toBe('/dashboard')
    })

    it('rejects backslash open redirect', () => {
        expect(sanitizeNext('/\\evil.com', ORIGIN)).toBe('/dashboard')
    })

    it('rejects percent-encoded double-slash open redirect', () => {
        expect(sanitizeNext('/%2f%2fevil.com', ORIGIN)).toBe('/dashboard')
    })

    it('rejects absolute URL to different origin', () => {
        expect(sanitizeNext('https://evil.com', ORIGIN)).toBe('/dashboard')
    })

    it('falls back to /dashboard for null', () => {
        expect(sanitizeNext(null, ORIGIN)).toBe('/dashboard')
    })

    it('falls back to /dashboard for empty string', () => {
        expect(sanitizeNext('', ORIGIN)).toBe('/dashboard')
    })
})
