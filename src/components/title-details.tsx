import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { mediaMetadata } from '@/lib/media'
import type { MediaTitle } from '@/lib/media'
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaRating } from '@/components/media-rating'
import { WatchOptions } from '@/components/watch-options'
import { fetchTitleDetails, MediaRequestError } from '@/lib/media-client'

export function TitleDetails({
  title,
  onClose,
  returnFocus,
  loadDetails = false,
}: {
  title: MediaTitle | null
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
  loadDetails?: boolean
}) {
  return (
    <Dialog
      open={title !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent finalFocus={returnFocus}>
        {title && (
          <Details
            key={`${title.mediaType}:${title.id}`}
            title={title}
            loadDetails={loadDetails}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Details({
  title: summary,
  loadDetails,
}: {
  title: MediaTitle
  loadDetails: boolean
}) {
  const [details, setDetails] = useState<MediaTitle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!loadDetails) return
    const controller = new AbortController()
    void fetchTitleDetails(
      summary.mediaType,
      summary.id,
      controller.signal,
    ).then(
      (value) => {
        if (!controller.signal.aborted) setDetails(value)
      },
      (cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof MediaRequestError
              ? cause.message
              : 'Could not load details. Try again.',
          )
      },
    )
    return () => controller.abort()
  }, [summary.mediaType, summary.id, loadDetails, attempt])
  const title = details ?? summary
  return (
    <>
      <DialogTitle>
        <a
          href={`https://www.themoviedb.org/${title.mediaType}/${title.id}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${title.title} on TMDB (opens in a new tab)`}
          className="rounded-sm underline-offset-4 hover:underline"
        >
          {title.title}{' '}
          <ArrowUpRight
            className="inline size-4 align-middle text-muted-foreground"
            aria-hidden="true"
          />
        </a>
      </DialogTitle>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
        <MediaRating rating={title.rating} />
        {mediaMetadata(title).join(' / ')}
      </p>
      <DialogDescription>
        {title.synopsis || 'No synopsis available.'}
      </DialogDescription>
      {error ? (
        <div className="text-sm text-muted-foreground">
          <p role="alert">{error}</p>
          <Button
            variant="ghost"
            className="mt-1 min-h-11 px-2"
            onClick={() => {
              setError(null)
              setAttempt((value) => value + 1)
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        loadDetails &&
        !details && (
          <output className="text-sm text-muted-foreground">
            Loading details…
          </output>
        )
      )}
      <WatchOptions title={title} />
    </>
  )
}
