import { useRef, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaCard, mediaFrameClassName } from '@/components/media-card'
import { TitleDetails } from '@/components/title-details'
import { useMediaPicker } from '@/hooks/use-media-picker'
import type { MediaType } from '@/lib/media'
import { cn } from '@/lib/utils'

export function RandomPicker({
  mediaType,
  active,
}: {
  mediaType: MediaType
  active: boolean
}) {
  const { title, pending, error, pickAnother } = useMediaPicker(
    mediaType,
    active,
  )
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsButton = useRef<HTMLButtonElement>(null)
  return (
    <div className="mx-auto flex w-full max-w-205 flex-col items-center gap-6 sm:gap-7">
      {title ? (
        <MediaCard
          title={title}
          detailsRef={detailsButton}
          onDetails={() => setDetailsOpen(true)}
        />
      ) : (
        <div
          className={cn(
            mediaFrameClassName,
            'items-center justify-center text-muted-foreground',
          )}
          aria-busy={pending}
        >
          <span>{pending ? 'Finding something good…' : 'No title loaded'}</span>
        </div>
      )}
      <Button
        variant="surface"
        className="min-h-14 min-w-52 gap-3 px-7 text-lg"
        aria-disabled={pending}
        onClick={() => {
          if (!pending) pickAnother()
        }}
      >
        <Shuffle className="size-5" aria-hidden="true" strokeWidth={1.75} />
        {pending ? 'Finding a pick…' : error ? 'Try again' : 'Pick another'}
      </Button>
      {error && (
        <p
          role="alert"
          className="max-w-[38ch] text-center text-muted-foreground"
        >
          {error}
        </p>
      )}
      <output className="sr-only">
        {pending ? 'Loading a recommendation' : ''}
      </output>
      <TitleDetails
        title={detailsOpen ? title : null}
        onClose={() => setDetailsOpen(false)}
        returnFocus={detailsButton}
      />
    </div>
  )
}
