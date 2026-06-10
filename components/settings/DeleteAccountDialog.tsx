'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/auth/client'

const CONFIRM_PHRASE = 'DELETE'

export function DeleteAccountDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [confirm, setConfirm] = useState('')
    const [deleting, setDeleting] = useState(false)

    const armed = confirm.trim() === CONFIRM_PHRASE

    async function handleDelete() {
        if (!armed) return
        setDeleting(true)
        const res = await fetch('/api/account', { method: 'DELETE' })
        if (!res.ok) {
            setDeleting(false)
            toast.error('Could not delete your account. Please try again.')
            return
        }
        // Clear the local session, then leave the app.
        try {
            await createClient().auth.signOut()
        } catch {
            // session already invalid server-side
        }
        toast.success('Your account has been deleted.')
        router.push('/auth/sign-in')
    }

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)}>
                Delete account
            </Button>
            <Dialog open={open} onOpenChange={(o) => !deleting && setOpen(o)}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogDescription>
                        This permanently deletes your account and every word, review, and stat
                        tied to it. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                    <Label htmlFor="confirm-delete">
                        Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to
                        confirm
                    </Label>
                    <Input
                        id="confirm-delete"
                        value={confirm}
                        autoComplete="off"
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={!armed || deleting}>
                        {deleting && (
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        )}
                        Delete account
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
