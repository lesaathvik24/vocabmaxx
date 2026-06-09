'use client'

import { createClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-slate-500 hover:text-slate-900 underline"
    >
      Sign out
    </button>
  )
}
