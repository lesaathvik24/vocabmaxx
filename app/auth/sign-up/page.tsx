import { AuthCard } from '@/components/auth/AuthCard'

export const metadata = { title: 'Sign up · VocabMaxx' }

// Rendered at request time (not prerendered at build): AuthCard instantiates a
// Supabase browser client from NEXT_PUBLIC_* env, which isn't available during
// static export and would crash the build.
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
    return <AuthCard mode="sign-up" />
}
