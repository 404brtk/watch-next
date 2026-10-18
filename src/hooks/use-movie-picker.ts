import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMovie, MovieRequestError } from '@/lib/movie-client'
import type { Movie } from '@/lib/movies'

export function useMoviePicker() {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seen = useRef<number[]>([])
  const request = useRef<AbortController | null>(null)

  const loadMovie = useCallback(async (controller: AbortController) => {
    try {
      const next = await fetchMovie(
        seen.current,
        AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]),
      )
      if (controller.signal.aborted) return
      seen.current = [...seen.current, next.id].slice(-50)
      setMovie(next)
    } catch (cause) {
      if (controller.signal.aborted) return
      setError(
        cause instanceof MovieRequestError
          ? cause.message
          : 'Could not load a movie. Please try again.',
      )
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }, [])

  function pickAnother() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError(null)
    void loadMovie(controller)
  }

  useEffect(() => {
    const controller = new AbortController()
    request.current = controller
    void loadMovie(controller)
    return () => request.current?.abort()
  }, [loadMovie])

  return { movie, pending, error, pickAnother }
}
