import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        },
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Every route in the (app) group. Kept in sync with the layout's requireUser()
    // as defense-in-depth so unauth'd users are redirected at the edge, not just SSR.
    const PROTECTED_PREFIXES = ['/dashboard', '/review', '/words', '/insights', '/capture', '/settings', '/algorithm']
    const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))

    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/sign-in'
        url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
