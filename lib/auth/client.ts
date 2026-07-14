import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    // This client only signs in and signs out — every authenticated read goes
    // through the server. Left running, its refresh timer races the middleware to
    // rewrite the chunked auth cookie on tab focus, which can strand a stale .1
    // chunk next to a fresh .0 and corrupt the session. Middleware owns the refresh.
    client.auth.stopAutoRefresh()
    return client
}
