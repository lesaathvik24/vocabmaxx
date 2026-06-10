import { describe, it, expect, vi } from 'vitest'
import { deleteAccount, type AccountDeps } from '@/lib/services/account.service'

describe('deleteAccount', () => {
    it('returns ok with the userId when the auth user is deleted', async () => {
        const deleteAuthUser = vi.fn().mockResolvedValue({ error: null })
        const deps: AccountDeps = { deleteAuthUser }
        const result = await deleteAccount('u1', deps)
        expect(deleteAuthUser).toHaveBeenCalledWith('u1')
        expect(result.ok).toBe(true)
        if (result.ok) expect(result.value.userId).toBe('u1')
    })

    it('returns a delete_failed error carrying the message when deletion fails', async () => {
        const deps: AccountDeps = {
            deleteAuthUser: vi.fn().mockResolvedValue({ error: { message: 'boom' } }),
        }
        const result = await deleteAccount('u1', deps)
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.kind).toBe('delete_failed')
            expect(result.error.message).toBe('boom')
        }
    })
})
