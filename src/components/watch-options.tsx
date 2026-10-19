import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CountryPicker } from '@/components/country-picker'
import { ProviderLogo } from '@/components/provider-logo'
import { useRegion } from '@/components/region-provider'
import { fetchWatchAvailability, MediaRequestError } from '@/lib/media-client'
import type { MediaTitle } from '@/lib/media'
import type { WatchAvailability } from '@/lib/discovery'

function Availability({
  title,
  country,
}: {
  title: MediaTitle
  country: string
}) {
  const [data, setData] = useState<WatchAvailability | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    void fetchWatchAvailability(
      title.mediaType,
      title.id,
      country,
      controller.signal,
    ).then(
      (value) => {
        if (!controller.signal.aborted) setData(value)
      },
      (cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof MediaRequestError
              ? cause.message
              : 'Could not load viewing options. Try again.',
          )
      },
    )
    return () => controller.abort()
  }, [title.mediaType, title.id, country, attempt])

  if (error)
    return (
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
    )
  if (!data)
    return (
      <output className="text-sm text-muted-foreground">
        Loading viewing options…
      </output>
    )
  return (
    <div className="space-y-5">
      {data.groups.length ? (
        data.groups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 text-sm text-muted-foreground">
              {group.label}
            </h3>
            <ul className="flex flex-wrap gap-x-5 gap-y-3">
              {group.providers.map((provider) => (
                <li
                  key={provider.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <ProviderLogo provider={provider} />
                  <span>{provider.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No viewing options listed for this country.
        </p>
      )}
      {data.link && (
        <a
          href={data.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm underline underline-offset-4"
        >
          View watch options on TMDB
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      )}
      <p className="text-xs text-muted-foreground">
        Availability from{' '}
        <a
          href="https://www.justwatch.com"
          className="underline underline-offset-3"
        >
          JustWatch
        </a>
        .
      </p>
    </div>
  )
}

export function WatchOptions({ title }: { title: MediaTitle }) {
  const { country } = useRegion()
  return (
    <section
      aria-label="Where to watch"
      className="space-y-3 border-t border-white/8 pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h2 className="text-base font-medium">Where to watch</h2>
        <CountryPicker />
      </div>
      {country ? (
        <Availability
          key={`${title.mediaType}:${title.id}:${country}`}
          title={title}
          country={country}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Choose a country to see viewing options.
        </p>
      )}
    </section>
  )
}
