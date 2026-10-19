import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { mediaMetadata } from '@/lib/media'
import type { MediaTitle } from '@/lib/media'
import type { RefObject } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { MediaRating } from '@/components/media-rating'
import { WatchOptions } from '@/components/watch-options'

export function TitleDetails({
  title,
  onClose,
  returnFocus,
}: {
  title: MediaTitle | null
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  return (
    <Dialog
      open={title !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent finalFocus={returnFocus}>
        <DialogTitle>
          {title && (
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
          )}
        </DialogTitle>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
          {title && <MediaRating rating={title.rating} />}
          {title && mediaMetadata(title).join(' / ')}
        </p>
        <DialogDescription>
          {title?.synopsis || 'No synopsis available.'}
        </DialogDescription>
        {title && <WatchOptions title={title} />}
      </DialogContent>
    </Dialog>
  )
}
