import { Star } from 'lucide-react'

export function MediaRating({ rating }: { rating: number | null }) {
  if (rating === null) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground tabular-nums">
      <Star
        className="size-3.5"
        fill="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="sr-only">Rating: </span>
      {rating.toFixed(1)}
      <span className="sr-only"> out of 10</span>
    </span>
  )
}
