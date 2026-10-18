import { useState } from 'react'
import type { Ref } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { movieMetadata } from '@/lib/movies'
import type { Movie } from '@/lib/movies'

export const movieFrameClassName =
  'relative isolate flex aspect-[0.9] min-h-90 w-full items-end overflow-hidden rounded-[22px] bg-card shadow-(--card-shadow) sm:aspect-[1.85] sm:min-h-105 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_var(--surface-highlight)] after:outline after:-outline-offset-1 after:outline-(--image-outline) forced-colors:border forced-colors:border-[ButtonText]'

function Backdrop({ movie }: { movie: Movie }) {
  const [failed, setFailed] = useState(false)
  return failed || !movie.backdrop ? (
    <div className="absolute inset-0 -z-1 grid place-items-center text-muted-foreground">
      Artwork unavailable
    </div>
  ) : (
    <img
      className="absolute inset-0 -z-3 size-full object-cover object-[62%_center] sm:object-center"
      src={movie.backdrop}
      alt=""
      width={1066}
      height={600}
      ref={(image) => {
        if (image?.complete && image.naturalWidth === 0) setFailed(true)
      }}
      onError={() => setFailed(true)}
    />
  )
}

export function MovieCard({
  movie,
  detailsRef,
  onDetails,
}: {
  movie: Movie
  detailsRef: Ref<HTMLButtonElement>
  onDetails: () => void
}) {
  return (
    <article className={movieFrameClassName} aria-label="Movie recommendation">
      <Backdrop key={movie.id} movie={movie} />
      <div className="absolute inset-0 -z-2 bg-(image:--film-scrim)" />
      <div className="flex w-full items-end gap-3 px-5.5 py-6 sm:gap-6 sm:px-8.5 sm:py-7.5 forced-colors:bg-[Canvas]">
        <div className="min-w-0 flex-1" aria-live="polite" aria-atomic="true">
          <h1 className="mb-3 text-[clamp(1.75rem,7vw,2.5rem)] leading-[1.2] font-[550] tracking-[-0.02em] text-balance wrap-break-word sm:text-[clamp(2rem,4.5vw,3.5rem)] sm:leading-[1.1]">
            {movie.title}
          </h1>
          <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-base text-muted-foreground tabular-nums sm:gap-x-5 sm:gap-y-1.5">
            {movieMetadata(movie).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </p>
        </div>
        <Button
          ref={detailsRef}
          className="size-11 p-0 max-sm:absolute max-sm:inset-e-4 max-sm:top-4"
          variant="surface"
          size="icon"
          aria-label={`Read about ${movie.title}`}
          onClick={onDetails}
        >
          <Info className="size-5" aria-hidden="true" strokeWidth={1.75} />
        </Button>
      </div>
    </article>
  )
}
