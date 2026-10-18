import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { ArrowUpRight, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { movieMetadata } from '@/lib/movies'
import { MovieCard, movieFrameClassName } from '@/components/movie-card'
import { cn } from '@/lib/utils'
import { useMoviePicker } from '@/hooks/use-movie-picker'
import tmdbLogo from '@/assets/tmdb.svg'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { movie, pending, error, pickAnother } = useMoviePicker()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsButton = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative isolate flex min-h-svh flex-col bg-(image:--canvas-gradient) before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:bg-(--texture) before:opacity-16 before:[mask:url('/dither.svg')_center/1440px_960px_repeat]">
      <main className="grid flex-1 place-items-center px-5 py-6 sm:px-8 sm:py-12">
        <div className="flex w-full max-w-205 min-w-0 flex-col items-center gap-6 sm:gap-7">
          {movie ? (
            <MovieCard
              movie={movie}
              detailsRef={detailsButton}
              onDetails={() => setDetailsOpen(true)}
            />
          ) : (
            <div
              className={cn(
                movieFrameClassName,
                'items-center justify-center text-muted-foreground',
              )}
              aria-busy={pending}
            >
              <output>{pending ? 'Finding a film…' : 'No film loaded'}</output>
            </div>
          )}
          <div className="flex max-w-full flex-col items-center gap-4">
            <Button
              variant="surface"
              className="h-auto min-h-14 min-w-52 max-w-full gap-3 py-3.25 pr-7 pl-6.5 text-lg leading-normal tracking-[-0.01em] whitespace-normal sm:min-h-15 sm:min-w-56 sm:py-3.5 sm:text-xl sm:leading-normal"
              aria-disabled={pending}
              onClick={() => {
                if (!pending) void pickAnother()
              }}
            >
              <Shuffle
                className="size-5"
                aria-hidden="true"
                strokeWidth={1.75}
              />
              {pending
                ? 'Finding a film…'
                : error
                  ? 'Try again'
                  : 'Pick another'}
            </Button>
            {error && (
              <p
                className="max-w-[38ch] text-center text-pretty text-muted-foreground"
                role="alert"
              >
                {error}
              </p>
            )}
            <output className="sr-only">
              {pending ? 'Loading a movie' : ''}
            </output>
          </div>
        </div>
        {movie && (
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent finalFocus={detailsButton}>
              <DialogTitle>{movie.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {movieMetadata(movie).join(' / ')}
              </p>
              <DialogDescription>
                {movie.synopsis || 'No synopsis available.'}
              </DialogDescription>
              <a
                className="inline-flex min-h-11 w-fit items-center gap-1.5 text-base underline underline-offset-5"
                href={`https://www.themoviedb.org/movie/${movie.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View on TMDB <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </DialogContent>
          </Dialog>
        )}
      </main>
      <footer aria-label="Credits" className="px-5 pb-5 text-center">
        <Dialog>
          <DialogTrigger className="min-h-11 rounded-sm px-2 text-[13px] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground">
            Film data from TMDB
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Film data</DialogTitle>
            <DialogDescription>
              Movie information and artwork are supplied by{' '}
              <a href="https://www.themoviedb.org">The Movie Database (TMDB)</a>
              .
            </DialogDescription>
            <a
              href="https://www.themoviedb.org"
              className="flex min-h-11 w-fit items-center rounded-sm"
            >
              <img
                src={tmdbLogo}
                alt="TMDB"
                width={96}
                height={13}
                className="h-auto w-24"
              />
            </a>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This application uses TMDB and the TMDB APIs but is not endorsed,
              certified, or otherwise approved by TMDB.
            </p>
          </DialogContent>
        </Dialog>
      </footer>
    </div>
  )
}
