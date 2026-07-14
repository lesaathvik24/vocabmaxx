import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component — cookies set by middleware
                    }
                },
            },
        },
    )
}

/**
 * A client that reads the session but never writes cookies back.
 *
 * The auth cookie is chunked (Google's provider_token pushes it over 4KB), and a
 * refresh rewrites .0 while deleting .1. If two responses to the same navigation
 * both try that, the browser can keep a new .0 next to a stale .1 — the chunks
 * then concatenate into garbage and the session reads as absent. Middleware runs
 * on every matched request and forwards the refreshed cookies onto the request it
 * passes down, so anything downstream already sees a fresh token and has no reason
 * to rotate one itself. Keeping it read-only makes middleware the sole writer.
 */
export async function createReadOnlyClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {},
            },
        },
    )
}

export async function requireUser(): Promise<User> {
    const supabase = await createReadOnlyClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
        redirect('/auth/sign-in')
    }
    return data.user
}
