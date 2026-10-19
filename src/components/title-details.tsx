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
import { useLanguage } from '@/components/language-provider'
import { locales } from '@/lib/i18n'

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
  const { language } = useLanguage()
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
            key={`${title.mediaType}:${title.id}:${language}`}
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
  const { language, t } = useLanguage()
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
      language,
    ).then(
      (value) => {
        if (!controller.signal.aborted) setDetails(value)
      },
      (cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof MediaRequestError ? cause.message : t.detailsError,
          )
      },
    )
    return () => controller.abort()
  }, [
    summary.mediaType,
    summary.id,
    loadDetails,
    attempt,
    language,
    t.detailsError,
  ])
  const title = details ?? summary
  return (
    <>
      <DialogTitle>
        <a
          href={`https://www.themoviedb.org/${title.mediaType}/${title.id}?language=${locales[language]}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t.tmdbTitle(title.title)}
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
        {mediaMetadata(title, language).join(' / ')}
      </p>
      <DialogDescription>{title.synopsis || t.noSynopsis}</DialogDescription>
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
            {t.retry}
          </Button>
        </div>
      ) : (
        loadDetails &&
        !details && (
          <output className="text-sm text-muted-foreground">
            {t.loadingDetails}
          </output>
        )
      )}
      <WatchOptions title={title} />
    </>
  )
}
