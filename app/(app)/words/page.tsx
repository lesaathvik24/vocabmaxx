import { BookOpen } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export const metadata = { title: 'Words' }

export default function WordsPage() {
    return (
        <ComingSoon
            icon={BookOpen}
            title="Your word library is on its way"
            body="Browse, search, and edit every word you've captured. We're building it now — capture a few words in the meantime."
        />
    )
}
