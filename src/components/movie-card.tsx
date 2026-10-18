import { useState } from 'react'
import type { Ref } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRuntime } from '@/lib/movies'
import type { Movie } from '@/lib/movies'

function Backdrop({ movie }: { movie: Movie }) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <div className="artwork-error">Artwork unavailable</div>
  ) : (
    <img
      className="film-artwork"
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
    <article className="film" aria-label="Movie recommendation">
      <Backdrop key={movie.id} movie={movie} />
      <div className="film-shade" />
      <div className="film-caption">
        <div className="film-copy" aria-live="polite" aria-atomic="true">
          <h1>{movie.title}</h1>
          <p className="film-meta">
            <span>{movie.year}</span>
            <span>{formatRuntime(movie.runtime)}</span>
            <span>{movie.genreLabel.split(' · ')[0]}</span>
          </p>
        </div>
        <Button
          ref={detailsRef}
          className="details-button"
          variant="surface"
          size="icon"
          aria-label={`Read about ${movie.title}`}
          onClick={onDetails}
        >
          <Info aria-hidden="true" strokeWidth={1.75} />
        </Button>
      </div>
    </article>
  )
}
