import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { ArrowUpRight, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { movies, formatRuntime, pickMovie } from '@/lib/movies'
import { MovieCard } from '@/components/movie-card'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [movie, setMovie] = useState(movies[2])
  const [seen, setSeen] = useState<readonly number[]>([movies[2].id])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsButton = useRef<HTMLButtonElement>(null)

  function nextMovie() {
    const next = pickMovie(movie.id, seen)
    setMovie(next)
    setSeen(
      seen.length >= movies.length ? [movie.id, next.id] : [...seen, next.id],
    )
  }

  return (
    <main className="cinema">
      <div className="recommendation">
        <MovieCard
          movie={movie}
          detailsRef={detailsButton}
          onDetails={() => setDetailsOpen(true)}
        />
        <Button variant="surface" className="pick-button" onClick={nextMovie}>
          <Shuffle aria-hidden="true" strokeWidth={1.75} />
          Pick another
        </Button>
      </div>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="film-dialog" finalFocus={detailsButton}>
          <DialogTitle>{movie.title}</DialogTitle>
          <p className="dialog-meta">
            {movie.year} / {formatRuntime(movie.runtime)} / {movie.genreLabel}
          </p>
          <DialogDescription>{movie.synopsis}</DialogDescription>
          <a
            className="movie-link"
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noreferrer"
          >
            View on TMDB <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <p className="collection-note">
            A local selection of six films. Live recommendations are not
            connected yet.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  )
}
