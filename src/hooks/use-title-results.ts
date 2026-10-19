import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTitles, MediaRequestError } from '@/lib/media-client'
import type { MediaPage, MediaType } from '@/lib/media'
import { useLanguage } from '@/components/language-provider'

type Selection = { query: string } | { id: number }

export function useTitleResults(mediaType: MediaType) {
  const { language, t } = useLanguage()
  const [selection, setSelection] = useState<Selection | null>(null)
  const [data, setData] = useState<MediaPage | null>(null)
  const [pending, setPending] = useState(false)
  const [dataLanguage, setDataLanguage] = useState(language)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failedPage = useRef(1)
  const previousLanguage = useRef(language)

  if (dataLanguage !== language) {
    setDataLanguage(language)
    setData(null)
    setError(null)
    setPending(selection !== null)
  }

  useEffect(
    () => () => {
      if (searchTimer.current !== null) clearTimeout(searchTimer.current)
      request.current?.abort()
    },
    [],
  )

  const load = useCallback(
    (next: Selection, page: number) => {
      request.current?.abort()
      const controller = new AbortController()
      request.current = controller
      failedPage.current = page
      return fetchTitles(mediaType, next, page, controller.signal, language)
        .then((result) => {
          if (controller.signal.aborted) return
          setError(null)
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
        })
        .catch((cause: unknown) => {
          if (!controller.signal.aborted) {
            if (page === 1) setData(null)
            setError(
              cause instanceof MediaRequestError
                ? cause.message
                : t.titlesError,
            )
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setPending(false)
          }
        })
    },
    [mediaType, language, t.titlesError],
  )

  useEffect(() => {
    if (previousLanguage.current === language) return
    previousLanguage.current = language
    if (searchTimer.current !== null) clearTimeout(searchTimer.current)
    searchTimer.current = null
    request.current?.abort()
    if (selection) void load(selection, 1)
  }, [language, selection, load])

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
    data: dataLanguage === language ? data : null,
    pending: pending || (selection !== null && dataLanguage !== language),
    error: dataLanguage === language ? error : null,
    selection,
    search,
    searchByTitle,
    reset,
    loadMore: () => {
      if (
        selection &&
        !pending &&
        dataLanguage === language &&
        data &&
        data.page < data.totalPages
      ) {
        setPending(true)
        setError(null)
        void load(selection, data.page + 1)
      }
    },
    retry: () => {
      if (selection && !pending && dataLanguage === language) {
        setPending(true)
        setError(null)
        void load(selection, failedPage.current)
      }
    },
  }
}
