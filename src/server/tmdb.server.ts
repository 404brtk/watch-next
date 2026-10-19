import { Effect, Schema } from 'effect'
import type { MediaPage, MediaTitle, MediaType } from '../lib/media'
import { imageConfiguration, request, TmdbError } from './tmdb-client.server'
import { discoveryOptions } from './discovery-options.server'
import type { DiscoveryFilters } from '../lib/discovery'

const PositiveInteger = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThan(0),
)
const RawTitleSchema = Schema.Struct({
  id: PositiveInteger,
  adult: Schema.Boolean,
  title: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  release_date: Schema.optional(Schema.String),
  first_air_date: Schema.optional(Schema.String),
  runtime: Schema.optional(Schema.NullOr(Schema.Number)),
  genres: Schema.optional(Schema.Array(Schema.Struct({ name: Schema.String }))),
  genre_ids: Schema.optional(Schema.Array(PositiveInteger)),
  backdrop_path: Schema.NullOr(Schema.String),
  poster_path: Schema.NullOr(Schema.String),
  overview: Schema.NullOr(Schema.String),
  vote_average: Schema.Number.check(
    Schema.isBetween({ minimum: 0, maximum: 10 }),
  ),
  vote_count: Schema.Number.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(0),
  ),
})
const PageSchema = Schema.Struct({
  page: PositiveInteger,
  total_pages: Schema.Number.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(0),
  ),
  results: Schema.Array(RawTitleSchema),
})

function normalize(
  raw: typeof RawTitleSchema.Type,
  mediaType: MediaType,
  imageBase: string,
  genres: readonly { id: number; name: string }[] = [],
) {
  return Effect.gen(function* () {
    const title = mediaType === 'movie' ? raw.title : raw.name
    const date = mediaType === 'movie' ? raw.release_date : raw.first_air_date
    if (
      !title?.trim() ||
      [raw.backdrop_path, raw.poster_path].some(
        (path) => path && !/^\/[a-zA-Z0-9._-]+$/.test(path),
      )
    ) {
      return yield* new TmdbError({ reason: 'invalid-response' })
    }
    return {
      id: raw.id,
      mediaType,
      title,
      year:
        date && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? Number(date.slice(0, 4))
          : null,
      runtime:
        mediaType === 'movie' && raw.runtime && raw.runtime > 0
          ? raw.runtime
          : null,
      genres:
        raw.genres?.map((genre) => genre.name) ??
        (raw.genre_ids ?? []).flatMap((id) => {
          const genre = genres.find((item) => item.id === id)
          return genre ? [genre.name] : []
        }),
      backdrop: raw.backdrop_path
        ? `${imageBase}w1280${raw.backdrop_path}`
        : null,
      poster: raw.poster_path ? `${imageBase}w342${raw.poster_path}` : null,
      synopsis: raw.overview?.trim() || '',
      rating: raw.vote_count > 0 ? raw.vote_average : null,
    } satisfies MediaTitle
  })
}

export function titleDetails(token: string, mediaType: MediaType, id: number) {
  return Effect.gen(function* () {
    const details = yield* request(
      token,
      `/${mediaType}/${id}?language=en-US`,
      RawTitleSchema,
    )
    if (details.adult || details.id !== id)
      return yield* new TmdbError({ reason: 'invalid-response' })
    const images = yield* imageConfiguration(token)
    return yield* normalize(details, mediaType, images.secure_base_url)
  })
}

export function pickTitle(
  token: string,
  mediaType: MediaType,
  excludedIds: readonly number[],
  selectedFilters: DiscoveryFilters,
  country: string | null,
) {
  return Effect.gen(function* () {
    if (selectedFilters.genres.length || selectedFilters.providers.length) {
      const options = yield* discoveryOptions(token, mediaType, country)
      if (
        selectedFilters.genres.some(
          (id) => !options.genres.some((genre) => genre.id === id),
        ) ||
        selectedFilters.providers.some(
          (id) => !options.providers.some((provider) => provider.id === id),
        )
      )
        return yield* new TmdbError({ reason: 'invalid-filters' })
    }
    const today = new Date().toISOString().slice(0, 10)
    const filters = new URLSearchParams({
      language: 'en-US',
      include_adult: 'false',
      sort_by: 'popularity.desc',
      'vote_count.gte': '100',
      ...(mediaType === 'movie'
        ? {
            include_video: 'false',
            'primary_release_date.lte': today,
            'with_runtime.gte': '60',
          }
        : {
            'first_air_date.lte': today,
            include_null_first_air_dates: 'false',
          }),
    })
    if (selectedFilters.genres.length)
      filters.set('with_genres', selectedFilters.genres.join('|'))
    if (selectedFilters.minRating)
      filters.set('vote_average.gte', String(selectedFilters.minRating))
    if (selectedFilters.maxRuntime !== null)
      filters.set('with_runtime.lte', String(selectedFilters.maxRuntime - 1))
    if (selectedFilters.providers.length) {
      if (!country) return yield* new TmdbError({ reason: 'invalid-filters' })
      filters.set('watch_region', country)
      filters.set('with_watch_providers', selectedFilters.providers.join('|'))
      filters.set('with_watch_monetization_types', 'flatrate')
    }
    const path = `/discover/${mediaType}?${filters}`
    const firstPage = yield* request(token, `${path}&page=1`, PageSchema)
    const pageCount = Math.min(firstPage.total_pages, 20)
    if (!pageCount) return yield* new TmdbError({ reason: 'empty' })
    const page = Math.floor(Math.random() * pageCount) + 1
    const discovery =
      page === 1
        ? firstPage
        : yield* request(token, `${path}&page=${page}`, PageSchema)
    const candidates = [discovery, firstPage]
      .map(({ results }) =>
        results.filter(
          (title) => !title.adult && !excludedIds.includes(title.id),
        ),
      )
      .find((titles) => titles.length > 0)
    if (!candidates) return yield* new TmdbError({ reason: 'empty' })
    const selected = candidates[Math.floor(Math.random() * candidates.length)]
    return yield* titleDetails(token, mediaType, selected.id)
  })
}

export function findTitles(
  token: string,
  mediaType: MediaType,
  page: number,
  selection: { query: string } | { id: number },
) {
  return Effect.gen(function* () {
    const params = new URLSearchParams({
      language: 'en-US',
      page: String(page),
      include_adult: 'false',
    })
    if ('query' in selection) params.set('query', selection.query)
    const path =
      'query' in selection
        ? `/search/${mediaType}`
        : `/${mediaType}/${selection.id}/recommendations`
    const response = yield* request(token, `${path}?${params}`, PageSchema)
    if (response.page !== page)
      return yield* new TmdbError({ reason: 'invalid-response' })
    const genres = response.results.some((title) => title.genre_ids?.length)
      ? (yield* discoveryOptions(token, mediaType, null)).genres
      : []
    const images = yield* imageConfiguration(token)
    const results = yield* Effect.forEach(
      response.results.filter(
        (title) =>
          !title.adult && (!('id' in selection) || title.id !== selection.id),
      ),
      (title) => normalize(title, mediaType, images.secure_base_url, genres),
    )
    return {
      results,
      page,
      totalPages: Math.min(response.total_pages, 500),
    } satisfies MediaPage
  })
}
