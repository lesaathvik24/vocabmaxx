import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function sanitizeNext(raw: string | null, origin: string): string {
    if (!raw) return '/dashboard'
    try {
        const parsed = new URL(raw, origin)
        // Decoded pathname — catches /%2f%2f → // after decode
        const decoded = decodeURIComponent(parsed.pathname)
        if (
            parsed.origin !== origin ||
            !decoded.startsWith('/') ||
            decoded.startsWith('//')
        ) {
            return '/dashboard'
        }
        const result = parsed.pathname + (parsed.search ? parsed.search : '')
        return result || '/dashboard'
    } catch {
        return '/dashboard'
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = sanitizeNext(searchParams.get('next'), origin)

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) =>
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        ),
                },
            },
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session) {
            // Google returns provider_token/provider_refresh_token we never use. Left in
            // the session they bloat the cookie past 4KB, forcing @supabase/ssr to split
            // it into .0/.1 chunks — and a chunked cookie can strand a stale half across a
            // tab close, so the session reads as absent and the user is silently logged
            // out. Re-storing from just the two tokens drops the provider fields, keeping
            // the cookie a single sub-4KB entry that survives for the refresh-token's life.
            if (data.session.provider_token || data.session.provider_refresh_token) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                })
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_failed`)
}
