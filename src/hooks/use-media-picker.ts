import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchRandomTitle,
  fetchTitleDetails,
  MediaRequestError,
} from '@/lib/media-client'
import type { MediaTitle, MediaType } from '@/lib/media'
import { defaultDiscoveryFilters } from '@/lib/discovery'
import type { DiscoveryFilters } from '@/lib/discovery'
import { useLanguage } from '@/components/language-provider'
import type { Language } from '@/lib/i18n'

export function useMediaPicker(mediaType: MediaType, active: boolean) {
  const { language, t } = useLanguage()
  const [title, setTitle] = useState<MediaTitle | null>(null)
  const [pending, setPending] = useState<Language | null>(language)
  const [error, setError] = useState<{
    language: Language
    message: string
  } | null>(null)
  const seen = useRef<number[]>([])
  const loaded = useRef<Language | null>(null)
  const request = useRef<AbortController | null>(null)

  const loadTitle = useCallback(
    async (
      controller: AbortController,
      filters: DiscoveryFilters,
      country: string | null = null,
      id?: number,
    ) => {
      setPending(language)
      setError(null)
      try {
        const next = id
          ? await fetchTitleDetails(mediaType, id, controller.signal, language)
          : await fetchRandomTitle(
              mediaType,
              seen.current,
              controller.signal,
              filters,
              country,
              language,
            )
        if (controller.signal.aborted) return
        if (!id) seen.current = [...seen.current, next.id].slice(-50)
        setTitle(next)
        loaded.current = language
      } catch (cause) {
        if (controller.signal.aborted) return
        setError({
          language,
          message:
            cause instanceof MediaRequestError ? cause.message : t.titleError,
        })
      } finally {
        if (!controller.signal.aborted) setPending(null)
      }
    },
    [mediaType, language, t.titleError],
  )

  function pickAnother(filters: DiscoveryFilters, country: string | null) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    void loadTitle(controller, filters, country)
  }

  useEffect(() => {
    if (!active || loaded.current === language) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    void loadTitle(controller, defaultDiscoveryFilters, null, title?.id)
    return () => controller.abort()
  }, [loadTitle, active, language, title?.id])

  useEffect(() => () => request.current?.abort(), [])

  return {
    title,
    pending: pending === language,
    error: error?.language === language ? error.message : null,
    pickAnother,
  }
}
