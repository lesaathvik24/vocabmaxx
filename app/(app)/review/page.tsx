import { Layers } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export const metadata = { title: 'Review' }

export default function ReviewPage() {
    return (
        <ComingSoon
            icon={Layers}
            title="Review sessions land next"
            body="Flip, grade, repeat — your due cards will queue up here. Keep capturing words so they're ready when reviews go live."
        />
    )
}
