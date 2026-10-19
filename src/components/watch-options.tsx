import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CountryPicker } from '@/components/country-picker'
import { ProviderLogo } from '@/components/provider-logo'
import { useRegion } from '@/components/region-provider'
import { fetchWatchAvailability, MediaRequestError } from '@/lib/media-client'
import type { MediaTitle } from '@/lib/media'
import type { WatchAvailability } from '@/lib/discovery'
import { useLanguage } from '@/components/language-provider'
import { locales } from '@/lib/i18n'

function Availability({
  title,
  country,
}: {
  title: MediaTitle
  country: string
}) {
  const { language, t } = useLanguage()
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
      language,
    ).then(
      (value) => {
        if (!controller.signal.aborted) setData(value)
      },
      (cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof MediaRequestError ? cause.message : t.viewingError,
          )
      },
    )
    return () => controller.abort()
  }, [title.mediaType, title.id, country, attempt, language, t.viewingError])

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
          {t.retry}
        </Button>
      </div>
    )
  if (!data)
    return (
      <output className="text-sm text-muted-foreground">
        {t.loadingViewing}
      </output>
    )
  const watchLink = data.link ? new URL(data.link) : null
  watchLink?.searchParams.set('language', locales[language])
  return (
    <div className="space-y-5">
      {data.groups.length ? (
        data.groups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 text-sm text-muted-foreground">
              {t.watchGroups[group.label]}
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
        <p className="text-sm text-muted-foreground">{t.noViewing}</p>
      )}
      {watchLink && (
        <a
          href={watchLink.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm underline underline-offset-4"
        >
          {t.watchOnTmdb}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      )}
      <p className="text-xs text-muted-foreground">
        {t.availabilityFrom}{' '}
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
  const { language, t } = useLanguage()
  const { country } = useRegion()
  return (
    <section
      aria-label={t.whereToWatch}
      className="space-y-3 border-t border-white/8 pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h2 className="text-base font-medium">{t.whereToWatch}</h2>
        <CountryPicker />
      </div>
      {country ? (
        <Availability
          key={`${title.mediaType}:${title.id}:${country}:${language}`}
          title={title}
          country={country}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t.chooseCountryForViewing}
        </p>
      )}
    </section>
  )
}
