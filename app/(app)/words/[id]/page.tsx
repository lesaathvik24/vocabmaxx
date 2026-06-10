import { BookOpen } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export const metadata = { title: 'Word detail' }

export default function WordDetailPage() {
    return (
        <ComingSoon
            icon={BookOpen}
            title="Word pages coming soon"
            body="Definition, examples, and SRS stats per word — plus edit and delete. Just around the corner."
        />
    )
}
