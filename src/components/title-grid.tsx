import { useState } from 'react'
import { Film } from 'lucide-react'
import type { MediaTitle } from '@/lib/media'
import { MediaRating } from '@/components/media-rating'

function Poster({ title }: { title: MediaTitle }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="relative mb-3 aspect-2/3 overflow-hidden rounded-[16px] bg-card shadow-(--card-shadow) after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_var(--surface-highlight)] after:outline after:-outline-offset-1 after:outline-(--image-outline)">
      {title.poster && !failed ? (
        <img
          src={title.poster}
          alt=""
          width={342}
          height={513}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center">
          <Film
            aria-hidden="true"
            className="size-8 text-muted-foreground"
            strokeWidth={1.25}
          />
        </div>
      )}
    </div>
  )
}

export function TitleGrid({
  titles,
  choosing,
  onSelect,
}: {
  titles: readonly MediaTitle[]
  choosing: boolean
  onSelect: (title: MediaTitle, button: HTMLButtonElement) => void
}) {
  const Heading = choosing ? 'h3' : 'h2'
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {titles.map((title) => (
        <li key={title.id} className="min-w-0">
          <button
            type="button"
            className="block w-full rounded-[16px] text-start"
            aria-label={`${choosing ? 'Find titles like' : 'Read about'} ${title.title}${title.year ? ` (${title.year})` : ''}`}
            onClick={(event) => onSelect(title, event.currentTarget)}
          >
            <Poster title={title} />
            <Heading className="text-base leading-snug font-medium text-pretty wrap-break-word sm:text-lg">
              {title.title}
            </Heading>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
              {title.year && <span>{title.year}</span>}
              <MediaRating rating={title.rating} />
            </p>
          </button>
        </li>
      ))}
    </ul>
  )
}
