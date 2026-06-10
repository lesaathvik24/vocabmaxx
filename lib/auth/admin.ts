import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS — server-only, never expose to the
 * browser. Used for privileged operations like deleting an auth user (which
 * cascades through every domain table via FK `on delete cascade`).
 */
export function createAdminClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}
