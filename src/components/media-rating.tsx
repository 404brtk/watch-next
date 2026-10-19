import { Star } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { formatRating } from '@/lib/i18n'

export function MediaRating({ rating }: { rating: number | null }) {
  const { language, t } = useLanguage()
  if (rating === null) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground tabular-nums">
      <Star
        className="size-3.5"
        fill="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span aria-hidden="true">{formatRating(rating, language)}</span>
      <span className="sr-only">
        {t.rating(formatRating(rating, language))}
      </span>
    </span>
  )
}
