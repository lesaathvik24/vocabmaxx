import type { Sense } from '@/lib/domain/word'
import { cn } from '@/lib/utils'

interface SenseListProps {
    senses: Sense[]
    /** Compact spacing + smaller type, for cards and the flashcard back. */
    dense?: boolean
    /** When set, occurrences of this term inside examples are bolded in cobalt. */
    highlight?: string
    className?: string
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Render an example, bolding occurrences of `term` in the brand color. */
function renderExample(text: string, term?: string): React.ReactNode {
    if (!term || !term.trim()) return text
    const parts = text.split(new RegExp(`(${escapeRegExp(term.trim())})`, 'gi'))
    return parts.map((part, i) =>
        part.toLowerCase() === term.trim().toLowerCase() ? (
            <b key={i} className="font-semibold not-italic text-accent">
                {part}
            </b>
        ) : (
            part
        ),
    )
}

/**
 * Renders every meaning of a word, numbered, primary first. Words captured
 * before multi-sense support have a single synthesised sense — see
 * `toSenses` for the fallback.
 */
export function SenseList({ senses, dense = false, highlight, className }: SenseListProps) {
    const numbered = senses.length > 1

    return (
        <ol className={cn(dense ? 'space-y-4' : 'space-y-5', className)}>
            {senses.map((sense, i) => (
                <li key={i} className="flex gap-2.5">
                    {numbered && (
                        <span
                            className={cn(
                                'num flex-shrink-0 select-none text-faint',
                                dense ? 'text-[11px] leading-6' : 'text-xs leading-7',
                            )}
                        >
                            {i + 1}.
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        {sense.partOfSpeech && (
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                                {sense.partOfSpeech}
                            </p>
                        )}
                        <p className={cn('leading-normal text-foreground', dense ? 'text-[15px]' : 'text-lg')}>
                            {sense.definition}
                        </p>
                        {sense.examples.length > 0 && (
                            <ul className={cn('space-y-2', dense ? 'mt-2.5' : 'mt-3')}>
                                {sense.examples.map((ex, j) => (
                                    <li
                                        key={j}
                                        className={cn(
                                            'border-l-[3px] border-[#dfe4f0] pl-3.5 leading-normal text-muted-foreground',
                                            dense ? 'text-[14px]' : 'text-[15px]',
                                        )}
                                    >
                                        {renderExample(ex, highlight)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    )
}

/**
 * Senses for a word, falling back to a single synthesised sense for rows
 * captured before multi-sense support landed.
 */
export function toSenses(
    senses: Sense[] | null | undefined,
    definition: string,
    examples: string[],
): Sense[] {
    if (senses && senses.length > 0) return senses
    return [{ partOfSpeech: null, definition, examples }]
}
