import { useEffect, useRef, useState } from 'react'
import { fetchTitles, MediaRequestError } from '@/lib/media-client'
import type { MediaPage, MediaType } from '@/lib/media'

type Selection = { query: string } | { id: number }

export function useTitleResults(mediaType: MediaType) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [data, setData] = useState<MediaPage | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failedPage = useRef(1)

  useEffect(
    () => () => {
      if (searchTimer.current !== null) clearTimeout(searchTimer.current)
      request.current?.abort()
    },
    [],
  )

  async function load(next: Selection, page: number) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    failedPage.current = page
    setPending(true)
    setError(null)
    try {
      const result = await fetchTitles(mediaType, next, page, controller.signal)
      if (controller.signal.aborted) return
      setData((previous) => {
        const titles =
          page > 1
            ? [...(previous?.results ?? []), ...result.results]
            : result.results
        return {
          ...result,
          results: [
            ...new Map(titles.map((title) => [title.id, title])).values(),
          ],
        }
      })
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof MediaRequestError
            ? cause.message
            : 'Could not load titles. Try again.',
        )
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function search(next: Selection, delay = 0) {
    if (
      'query' in next &&
      selection &&
      'query' in selection &&
      next.query === selection.query &&
      !error &&
      (delay > 0 || searchTimer.current === null)
    )
      return
    reset()
    setSelection(next)
    setPending(true)
    if (delay > 0) {
      searchTimer.current = setTimeout(() => {
        searchTimer.current = null
        void load(next, 1)
      }, delay)
    } else {
      void load(next, 1)
    }
  }

  function searchByTitle(value: string) {
    const query = value.trim()
    if (query.length < 2) reset()
    else search({ query }, 300)
  }

  function reset() {
    if (searchTimer.current !== null) clearTimeout(searchTimer.current)
    searchTimer.current = null
    request.current?.abort()
    setSelection(null)
    setData(null)
    setPending(false)
    setError(null)
  }

  return {
    data,
    pending,
    error,
    selection,
    search,
    searchByTitle,
    reset,
    loadMore: () => {
      if (selection && !pending && data && data.page < data.totalPages)
        void load(selection, data.page + 1)
    },
    retry: () => {
      if (selection && !pending) void load(selection, failedPage.current)
    },
  }
}
