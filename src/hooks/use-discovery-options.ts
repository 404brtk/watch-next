import { useEffect, useState } from 'react'
import { fetchDiscoveryOptions, MediaRequestError } from '@/lib/media-client'
import type { DiscoveryOptions } from '@/lib/discovery'
import type { MediaType } from '@/lib/media'

export function useDiscoveryOptions(
  mediaType: MediaType,
  country: string | null,
  active: boolean,
) {
  const key = `${mediaType}:${country ?? ''}`
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
    void fetchDiscoveryOptions(mediaType, controller.signal, country).then(
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
                : 'Could not load genres and services. Try again.',
          })
      },
    )
    return () => controller.abort()
  }, [mediaType, country, key, active, loaded, attempt])

  function retry() {
    setResult(null)
    setAttempt((value) => value + 1)
  }

  return { options, error, retry }
}
