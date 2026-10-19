import { useRef, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaCard, mediaFrameClassName } from '@/components/media-card'
import { TitleDetails } from '@/components/title-details'
import { useMediaPicker } from '@/hooks/use-media-picker'
import type { MediaType } from '@/lib/media'
import { cn } from '@/lib/utils'
import { defaultDiscoveryFilters } from '@/lib/discovery'
import { DiscoveryFilters } from '@/components/discovery-filters'
import { useDiscoveryOptions } from '@/hooks/use-discovery-options'
import { useRegion } from '@/components/region-provider'
import { useLanguage } from '@/components/language-provider'

export function RandomPicker({
  mediaType,
  active,
}: {
  mediaType: MediaType
  active: boolean
}) {
  const { t } = useLanguage()
  const { title, pending, error, pickAnother } = useMediaPicker(
    mediaType,
    active,
  )
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filters, setFilters] = useState(defaultDiscoveryFilters)
  const { country, countries, error: regionError } = useRegion()
  const [providerCountry, setProviderCountry] = useState(country)
  if (providerCountry !== country) {
    setProviderCountry(country)
    setFilters({ ...filters, providers: [] })
  }
  const {
    options,
    error: optionsError,
    retry,
  } = useDiscoveryOptions(
    mediaType,
    country,
    active && (countries.length > 0 || regionError !== null),
  )
  const detailsButton = useRef<HTMLButtonElement>(null)
  return (
    <div className="mx-auto flex w-full max-w-205 flex-col items-center gap-6 sm:gap-7">
      <DiscoveryFilters
        value={filters}
        onChange={setFilters}
        options={options}
        movies={mediaType === 'movie'}
      />
      {optionsError && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <p role="alert">{t.optionsError}</p>
          <Button variant="ghost" className="min-h-11" onClick={retry}>
            {t.retry}
          </Button>
        </div>
      )}
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
          <span>{pending ? t.findingGood : t.noTitle}</span>
        </div>
      )}
      <Button
        variant="surface"
        className="min-h-14 min-w-[min(13rem,100%)] max-w-full gap-3 px-3 text-lg whitespace-normal sm:px-7"
        aria-disabled={pending}
        onClick={() => {
          if (!pending) pickAnother(filters, country)
        }}
      >
        <Shuffle className="size-5" aria-hidden="true" strokeWidth={1.75} />
        {pending ? t.findingPick : error ? t.retry : t.pickAnother}
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
        {pending ? t.loadingRecommendation : ''}
      </output>
      <TitleDetails
        title={detailsOpen ? title : null}
        onClose={() => setDetailsOpen(false)}
        returnFocus={detailsButton}
      />
    </div>
  )
}
