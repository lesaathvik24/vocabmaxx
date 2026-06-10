import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetUser, mockCreateServerClient, mockRedirect, mockNext } = vi.hoisted(() => {
    const mockGetUser = vi.fn()
    const mockCreateServerClient = vi.fn()
    const mockRedirect = vi.fn()
    const mockNext = vi.fn()
    return { mockGetUser, mockCreateServerClient, mockRedirect, mockNext }
})

vi.mock('@supabase/ssr', () => ({
    createServerClient: mockCreateServerClient,
}))

vi.mock('next/server', () => {
    class MockNextResponse {
        cookies = { set: vi.fn(), getAll: vi.fn(() => []) }
        static redirect = mockRedirect
        static next = mockNext
    }
    return { NextResponse: MockNextResponse }
})

import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'

function makeRequest(pathname: string, search = '') {
    const searchParams = new URLSearchParams()
    return {
        nextUrl: {
            pathname,
            search,
            clone: () => ({
                pathname,
                searchParams,
                toString: () => `http://localhost${pathname}${search}`,
            }),
        },
        cookies: {
            getAll: () => [],
            set: vi.fn(),
        },
    } as unknown as NextRequest
}

describe('updateSession middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockNext.mockReturnValue({
            cookies: { set: vi.fn(), getAll: vi.fn(() => []) },
        })
        mockRedirect.mockReturnValue({ type: 'redirect', status: 307 })
        mockCreateServerClient.mockReturnValue({
            auth: { getUser: mockGetUser },
        })
    })

    it('redirects unauthenticated request for /dashboard to /auth/sign-in?next=/dashboard', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        await updateSession(makeRequest('/dashboard'))

        expect(mockRedirect).toHaveBeenCalledOnce()
        const redirectUrl = mockRedirect.mock.calls[0][0]
        expect(redirectUrl.pathname).toBe('/auth/sign-in')
        expect(redirectUrl.searchParams.get('next')).toBe('/dashboard')
    })

    it('returns NextResponse.next() without redirect when user is present', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } })

        const response = await updateSession(makeRequest('/dashboard'))

        expect(mockRedirect).not.toHaveBeenCalled()
        expect(mockNext).toHaveBeenCalled()
        expect(response).toBeDefined()
    })
})
