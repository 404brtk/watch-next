import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import tmdbLogo from '@/assets/tmdb.svg'

export function Credits() {
  return (
    <footer aria-label="Credits" className="px-5 pb-5 text-center">
      <Dialog>
        <DialogTrigger className="min-h-11 rounded-sm px-2 text-[13px] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground">
          Film & TV data from TMDB
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Film & TV data</DialogTitle>
          <DialogDescription>
            Film and TV information and artwork are supplied by{' '}
            <a href="https://www.themoviedb.org">The Movie Database (TMDB)</a>.
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
  )
}
