import { Data, Effect, Schema } from 'effect'
import type { Movie } from '../lib/movies'

export class TmdbError extends Data.TaggedError('TmdbError')<{
  endpoint?: string
  status?: number
  reason:
    | 'configuration'
    | 'authentication'
    | 'rate-limit'
    | 'unavailable'
    | 'invalid-response'
    | 'empty'
    | 'timeout'
}> {}

const MovieId = Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))
const DiscoverySchema = Schema.Struct({
  total_pages: Schema.Number.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(0),
  ),
  results: Schema.Array(Schema.Struct({ id: MovieId, adult: Schema.Boolean })),
})
const DetailsSchema = Schema.Struct({
  id: MovieId,
  title: Schema.String,
  adult: Schema.Boolean,
  release_date: Schema.String,
  runtime: Schema.NullOr(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  ),
  genres: Schema.Array(Schema.Struct({ name: Schema.String })),
  backdrop_path: Schema.NullOr(Schema.String),
  overview: Schema.NullOr(Schema.String),
})
const ConfigurationSchema = Schema.Struct({
  images: Schema.Struct({
    secure_base_url: Schema.String,
    backdrop_sizes: Schema.Array(Schema.String),
  }),
})

let configuration:
  | { images: typeof ConfigurationSchema.Type.images; expiresAt: number }
  | undefined

function request<A>(token: string, path: string, schema: Schema.Decoder<A>) {
  const endpoint = path.split('?')[0]
  return Effect.gen(function* () {
    const json = yield* Effect.tryPromise({
      try: async (signal) => {
        const response = await fetch(`https://api.themoviedb.org/3${path}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          signal,
        })
        if (!response.ok) {
          await response.body?.cancel()
          throw new TmdbError({
            endpoint,
            status: response.status,
            reason:
              response.status === 429
                ? 'rate-limit'
                : response.status === 401 || response.status === 403
                  ? 'authentication'
                  : 'unavailable',
          })
        }
        return response.json()
      },
      catch: (cause) =>
        cause instanceof TmdbError
          ? cause
          : new TmdbError({
              endpoint,
              reason:
                cause instanceof SyntaxError
                  ? 'invalid-response'
                  : 'unavailable',
            }),
    })
    return yield* Schema.decodeUnknownEffect(schema)(json).pipe(
      Effect.mapError(
        () => new TmdbError({ reason: 'invalid-response', endpoint }),
      ),
    )
  }).pipe(
    Effect.timeout('8 seconds'),
    Effect.catchTag('TimeoutError', () =>
      Effect.fail(new TmdbError({ reason: 'timeout', endpoint })),
    ),
  )
}

function imageConfiguration(token: string) {
  return Effect.gen(function* () {
    if (configuration && configuration.expiresAt > Date.now())
      return configuration.images
    const { images } = yield* request(
      token,
      '/configuration',
      ConfigurationSchema,
    )
    if (
      images.secure_base_url !== 'https://image.tmdb.org/t/p/' ||
      !images.backdrop_sizes.includes('w1280')
    ) {
      return yield* new TmdbError({ reason: 'invalid-response' })
    }
    configuration = { images, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
    return images
  })
}

export function pickMovie(
  token: string | undefined,
  excludedIds: readonly number[],
) {
  return Effect.gen(function* () {
    if (!token?.trim()) return yield* new TmdbError({ reason: 'configuration' })
    const today = new Date().toISOString().slice(0, 10)
    const filters = new URLSearchParams({
      language: 'en-US',
      include_adult: 'false',
      include_video: 'false',
      sort_by: 'popularity.desc',
      'primary_release_date.lte': today,
      'vote_count.gte': '100',
      'with_runtime.gte': '60',
    })
    const firstPage = yield* request(
      token,
      `/discover/movie?${filters}&page=1`,
      DiscoverySchema,
    )
    const pageCount = Math.min(firstPage.total_pages, 20)
    if (pageCount === 0) return yield* new TmdbError({ reason: 'empty' })
    const page = Math.floor(Math.random() * pageCount) + 1
    const discovery =
      page === 1
        ? firstPage
        : yield* request(
            token,
            `/discover/movie?${filters}&page=${page}`,
            DiscoverySchema,
          )
    const candidates = [discovery, firstPage]
      .map(({ results }) =>
        results.filter(
          (movie) => !movie.adult && !excludedIds.includes(movie.id),
        ),
      )
      .find((movies) => movies.length > 0)
    if (!candidates) return yield* new TmdbError({ reason: 'empty' })
    const selected = candidates[Math.floor(Math.random() * candidates.length)]
    const details = yield* request(
      token,
      `/movie/${selected.id}?language=en-US`,
      DetailsSchema,
    )
    if (details.adult || details.id !== selected.id || !details.title.trim())
      return yield* new TmdbError({ reason: 'invalid-response' })
    const images = yield* imageConfiguration(token)
    if (
      details.backdrop_path &&
      !/^\/[a-zA-Z0-9._-]+$/.test(details.backdrop_path)
    )
      return yield* new TmdbError({ reason: 'invalid-response' })
    return {
      id: details.id,
      title: details.title,
      year: /^\d{4}-\d{2}-\d{2}$/.test(details.release_date)
        ? Number(details.release_date.slice(0, 4))
        : null,
      runtime: details.runtime || null,
      genres: details.genres.map((genre) => genre.name),
      backdrop: details.backdrop_path
        ? `${images.secure_base_url}w1280${details.backdrop_path}`
        : null,
      synopsis: details.overview?.trim() || '',
    } satisfies Movie
  }).pipe(
    Effect.timeout('20 seconds'),
    Effect.catchTag('TimeoutError', () =>
      Effect.fail(new TmdbError({ reason: 'timeout' })),
    ),
  )
}
