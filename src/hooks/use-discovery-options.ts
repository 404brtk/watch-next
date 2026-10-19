import { useEffect, useState } from 'react'
import { fetchDiscoveryOptions, MediaRequestError } from '@/lib/media-client'
import type { DiscoveryOptions } from '@/lib/discovery'
import type { MediaType } from '@/lib/media'
import { useLanguage } from '@/components/language-provider'

export function useDiscoveryOptions(
  mediaType: MediaType,
  country: string | null,
  active: boolean,
) {
  const { language, t } = useLanguage()
  const key = `${mediaType}:${country ?? ''}:${language}`
  const [result, setResult] = useState<{
    key: string
    options: DiscoveryOptions | null
    error: string | null
  } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const options = result?.key === key ? result.options : null
  const error = result?.key === key ? result.error : null
  const loaded = options !== null

  useEffect(() => {
    if (!active || loaded) return
    const controller = new AbortController()
    void fetchDiscoveryOptions(
      mediaType,
      controller.signal,
      country,
      language,
    ).then(
      (value) => {
        if (!controller.signal.aborted) {
          setResult({ key, options: value, error: null })
        }
      },
      (cause) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            options: null,
            error:
              cause instanceof MediaRequestError
                ? cause.message
                : t.optionsError,
          })
      },
    )
    return () => controller.abort()
  }, [
    mediaType,
    country,
    key,
    active,
    loaded,
    attempt,
    language,
    t.optionsError,
  ])

  function retry() {
    setResult(null)
    setAttempt((value) => value + 1)
  }

  return { options, error, retry }
}
