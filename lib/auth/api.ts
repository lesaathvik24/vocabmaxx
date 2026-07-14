import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createReadOnlyClient } from './server'

export async function getUserForApi(): Promise<User | null> {
    const supabase = await createReadOnlyClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return data.user
}
