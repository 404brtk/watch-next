import { ArrowUpRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { mediaMetadata } from '@/lib/media'
import type { MediaTitle } from '@/lib/media'
import type { RefObject } from 'react'

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
        <DialogTitle>{title?.title}</DialogTitle>
        <p className="text-sm text-muted-foreground">
          {title && mediaMetadata(title).join(' / ')}
        </p>
        <DialogDescription>
          {title?.synopsis || 'No synopsis available.'}
        </DialogDescription>
        {title && (
          <a
            className="inline-flex min-h-11 w-fit items-center gap-1.5 text-base underline underline-offset-5"
            href={`https://www.themoviedb.org/${title.mediaType}/${title.id}`}
            target="_blank"
            rel="noreferrer"
          >
            View on TMDB <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        )}
      </DialogContent>
    </Dialog>
  )
}
