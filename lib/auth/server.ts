import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Session, User } from '@supabase/supabase-js'

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

export async function getSession(): Promise<Session | null> {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data.session
}

export async function requireUser(): Promise<User> {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
        throw new Response('Unauthorized', { status: 401 })
    }
    return data.user
}
