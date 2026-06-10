import 'server-only'
import { type Result, ok, err } from '@/lib/domain/errors'
import { createAdminClient } from '@/lib/auth/admin'

export type DeleteAccountError = { kind: 'delete_failed'; message: string }

export interface AccountDeps {
    /** Delete the auth user; domain rows cascade via FK. */
    deleteAuthUser(userId: string): Promise<{ error: { message: string } | null }>
}

const defaultDeps: AccountDeps = {
    deleteAuthUser: async (userId: string) => {
        const admin = createAdminClient()
        const { error } = await admin.auth.admin.deleteUser(userId)
        return { error: error ? { message: error.message } : null }
    },
}

/**
 * Permanently delete a user's account. Deleting the `auth.users` row cascades
 * through words / srs_state / review_log / import_jobs / user_preferences via
 * their `on delete cascade` foreign keys, so no per-table cleanup is needed.
 */
export async function deleteAccount(
    userId: string,
    deps: AccountDeps = defaultDeps,
): Promise<Result<{ userId: string }, DeleteAccountError>> {
    const { error } = await deps.deleteAuthUser(userId)
    if (error) return err({ kind: 'delete_failed', message: error.message })
    return ok({ userId })
}
