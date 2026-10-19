import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TitleGrid } from '@/components/title-grid'
import { TitleDetails } from '@/components/title-details'
import { useTitleResults } from '@/hooks/use-title-results'
import type { MediaTitle, MediaType } from '@/lib/media'

export function SimilarFinder({ mediaType }: { mediaType: MediaType }) {
  const [query, setQuery] = useState('')
  const [seed, setSeed] = useState<MediaTitle | null>(null)
  const [details, setDetails] = useState<MediaTitle | null>(null)
  const composing = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  const detailsButton = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const nextResult = useRef<{
    index: number
    trigger: HTMLButtonElement
  } | null>(null)
  const {
    data,
    pending,
    error,
    selection,
    search,
    searchByTitle,
    reset,
    loadMore,
    retry,
  } = useTitleResults(mediaType)

  useEffect(() => {
    const target = nextResult.current
    if (pending || !target) return
    nextResult.current = null
    if (document.activeElement !== target.trigger) return
    const button =
      results.current?.querySelectorAll<HTMLButtonElement>('li button')[
        target.index
      ]
    button?.scrollIntoView({ block: 'center' })
    button?.focus({ preventScroll: true })
  }, [data, pending])

  function choose(title: MediaTitle) {
    setSeed(title)
    search({ id: title.id })
    requestAnimationFrame(() => heading.current?.focus())
  }

  return (
    <section className="mx-auto w-full max-w-240">
      {seed ? (
        <div className="mb-8 flex items-start gap-4 sm:mb-10">
          <Button
            variant="surface"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Choose another title"
            onClick={() => {
              setSeed(null)
              reset()
              requestAnimationFrame(() => input.current?.focus())
            }}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="mb-1 text-sm text-muted-foreground">More like</p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="w-fit rounded-sm text-2xl leading-tight font-medium tracking-[-0.02em] text-pretty wrap-break-word sm:text-3xl"
            >
              {seed.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="mx-auto mb-9 w-full max-w-160 sm:mb-12">
          <h1 className="mb-6 text-center text-2xl font-medium tracking-[-0.02em] sm:text-3xl">
            Find something like…
          </h1>
          <form
            aria-label="Title search"
            onSubmit={(event) => {
              event.preventDefault()
              if (query.trim()) search({ query: query.trim() })
            }}
          >
            <label htmlFor={`title-search-${mediaType}`} className="sr-only">
              {mediaType === 'movie' ? 'Movie' : 'TV show'} you like
            </label>
            <div className="flex min-h-16 items-center gap-3 rounded-full border border-white/10 bg-(--glass-fill) py-2 ps-5 pe-2 shadow-(--control-shadow) backdrop-blur-xl has-[[data-slot=input]:focus-visible]:outline-2 has-[[data-slot=input]:focus-visible]:-outline-offset-2 has-[[data-slot=input]:focus-visible]:outline-ring [@media(prefers-reduced-transparency:reduce)]:bg-card forced-colors:border-[ButtonText] forced-colors:has-[[data-slot=input]:focus-visible]:outline-[Highlight]">
              <Search
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
                strokeWidth={1.75}
              />
              <Input
                ref={input}
                id={`title-search-${mediaType}`}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  if (!composing.current) searchByTitle(event.target.value)
                }}
                onCompositionStart={() => {
                  composing.current = true
                  reset()
                }}
                onCompositionEnd={(event) => {
                  composing.current = false
                  searchByTitle(event.currentTarget.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && event.nativeEvent.isComposing)
                    event.preventDefault()
                }}
                placeholder={
                  mediaType === 'movie'
                    ? 'A movie you love…'
                    : 'A show you love…'
                }
                maxLength={200}
                autoComplete="off"
                type="search"
                className="h-11 rounded-none border-0 bg-transparent p-0 text-base shadow-none outline-none focus-visible:ring-0 md:text-lg"
              />
              <Button
                type="submit"
                variant="surface"
                size="icon"
                aria-label="Search"
                disabled={!query.trim()}
                className="size-11 shrink-0"
              >
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </div>
      )}
      {data && data.results.length > 0 && (
        <>
          {!seed && (
            <h2 className="mb-5 text-base text-muted-foreground">
              Choose a {mediaType === 'movie' ? 'movie' : 'show'}
            </h2>
          )}
          <div ref={results}>
            <TitleGrid
              titles={data.results}
              choosing={!seed}
              onSelect={(title, button) => {
                if (!seed) choose(title)
                else {
                  detailsButton.current = button
                  setDetails(title)
                }
              }}
            />
          </div>
        </>
      )}
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <output className="text-base text-muted-foreground" aria-live="polite">
          {pending
            ? seed
              ? 'Finding similar titles…'
              : 'Searching…'
            : data?.results.length === 0
              ? seed
                ? 'No recommendations yet. Try another title.'
                : 'No matches. Try a different title.'
              : ''}
          <span className="sr-only">
            {!pending && data && data.results.length > 0
              ? `${data.results.length} ${seed ? 'recommendations' : 'search results'} loaded.`
              : ''}
          </span>
        </output>
        {error && (
          <p
            role="alert"
            className="max-w-[40ch] text-base text-muted-foreground"
          >
            {error}
          </p>
        )}
        {error ? (
          <Button
            variant="surface"
            className="min-h-12 px-6 text-base"
            onClick={retry}
            aria-disabled={pending}
          >
            Try again
          </Button>
        ) : (
          data &&
          data.page < data.totalPages && (
            <Button
              variant="surface"
              className="min-h-12 px-6 text-base"
              onClick={(event) => {
                if (!pending) {
                  nextResult.current = {
                    index: data.results.length,
                    trigger: event.currentTarget,
                  }
                  loadMore()
                }
              }}
              aria-disabled={pending}
            >
              {pending ? 'Loading…' : 'Load more'}
            </Button>
          )
        )}
        {!selection && (
          <span className="sr-only">
            Search for a title to get recommendations.
          </span>
        )}
      </div>
      <TitleDetails
        title={details}
        onClose={() => setDetails(null)}
        returnFocus={detailsButton}
      />
    </section>
  )
}
