import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRandomTitle, MediaRequestError } from '@/lib/media-client'
import type { MediaTitle, MediaType } from '@/lib/media'

export function useMediaPicker(mediaType: MediaType, active: boolean) {
  const [title, setTitle] = useState<MediaTitle | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seen = useRef<number[]>([])
  const loaded = useRef(false)
  const request = useRef<AbortController | null>(null)

  const loadTitle = useCallback(
    async (controller: AbortController) => {
      setPending(true)
      setError(null)
      try {
        const next = await fetchRandomTitle(
          mediaType,
          seen.current,
          controller.signal,
        )
        if (controller.signal.aborted) return
        seen.current = [...seen.current, next.id].slice(-50)
        setTitle(next)
        loaded.current = true
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(
          cause instanceof MediaRequestError
            ? cause.message
            : 'Could not load a title. Please try again.',
        )
      } finally {
        if (!controller.signal.aborted) setPending(false)
      }
    },
    [mediaType],
  )

  function pickAnother() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    void loadTitle(controller)
  }

  useEffect(() => {
    if (!active || loaded.current) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    void loadTitle(controller)
  }, [loadTitle, active])

  useEffect(() => () => request.current?.abort(), [])

  return { title, pending, error, pickAnother }
}
