import { Effect, Schema } from 'effect'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { findTitles, pickTitle, titleDetails } from './tmdb.server'
import { TmdbError } from './tmdb-client.server'
import type { MediaPage, MediaTitle } from '../lib/media'
import { CountryCodeSchema, DiscoveryFiltersSchema } from '../lib/discovery'
import type { DiscoveryOptions } from '../lib/discovery'
import { availableRegions, discoveryOptions } from './discovery-options.server'
import { watchAvailability } from './watch-availability.server'

type ApiEnv = { Bindings: { TMDB_READ_ACCESS_TOKEN?: string } }
export const api = new Hono<ApiEnv>()
api.use('/api/*', async (context, next) => {
  context.header('Cache-Control', 'no-store')
  await next()
})

api.get('/api/regions', (context) =>
  execute(context, (token) =>
    availableRegions(token).pipe(
      Effect.map((countries) => {
        const request = context.req.raw
        const geo = 'cf' in request ? request.cf : null
        const hint =
          geo && typeof geo === 'object' && 'country' in geo
            ? geo.country
            : context.req.header('CF-IPCountry')
        return {
          countries,
          detectedCountry:
            countries.find((country) => country.code === hint)?.code ?? null,
        }
      }),
    ),
  ),
)

function parseIds(value: string | undefined, limit: number) {
  if (!value) return []
  if (value.length > 800 || !/^\d+(,\d+)*$/.test(value)) return null
  const ids = value.split(',').map(Number)
  return ids.length > limit ||
    ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    ? null
    : [...new Set(ids)]
}

api.get('/api/:mediaType/:action', async (context) => {
  const { mediaType, action } = context.req.param()
  if (
    (mediaType !== 'movie' && mediaType !== 'tv') ||
    ![
      'pick',
      'search',
      'recommendations',
      'options',
      'watch',
      'details',
    ].includes(action)
  ) {
    return context.json({ error: 'Not found.' }, 404)
  }
  const ids = parseIds(context.req.query('exclude'), 50)
  const filters = {
    genres: parseIds(context.req.query('genres'), 30),
    providers: parseIds(context.req.query('providers'), 50),
    maxRuntime:
      context.req.query('maxRuntime') === undefined
        ? null
        : Number(context.req.query('maxRuntime')),
    minRating: Number(context.req.query('minRating') ?? '0'),
  }
  const page = Number(context.req.query('page') ?? '1')
  const query = (context.req.query('query') ?? '').trim()
  const id = Number(context.req.query('id'))
  const country = context.req.query('country') ?? null
  if (
    ids === null ||
    (country !== null && !Schema.is(CountryCodeSchema)(country)) ||
    (filters.providers?.length && !country) ||
    !Schema.is(DiscoveryFiltersSchema)(filters) ||
    (mediaType === 'tv' && filters.maxRuntime !== null) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 500 ||
    (action === 'search' && (!query || query.length > 200)) ||
    (['recommendations', 'watch', 'details'].includes(action) &&
      (!Number.isSafeInteger(id) || id <= 0))
  )
    return context.json({ error: 'Invalid selection.' }, 400)

  if (action === 'watch') {
    if (!country) return context.json({ error: 'Choose a country.' }, 400)
    return execute(context, (token) =>
      watchAvailability(token, mediaType, id, country),
    )
  }
  return execute(context, (token) => {
    const operation: Effect.Effect<
      MediaTitle | MediaPage | DiscoveryOptions,
      TmdbError
    > =
      action === 'pick'
        ? pickTitle(token, mediaType, ids, filters, country)
        : action === 'options'
          ? discoveryOptions(token, mediaType, country)
          : action === 'details'
            ? titleDetails(token, mediaType, id)
            : findTitles(
                token,
                mediaType,
                page,
                action === 'search' ? { query } : { id },
              )

    return operation
  })
})

function execute<A>(
  context: Context<ApiEnv>,
  operation: (token: string) => Effect.Effect<A, TmdbError>,
) {
  const token = context.env.TMDB_READ_ACCESS_TOKEN?.trim()
  const result = token
    ? operation(token)
    : Effect.fail(new TmdbError({ reason: 'configuration' }))
  return Effect.runPromise(
    result.pipe(
      Effect.timeout('20 seconds'),
      Effect.catchTag('TimeoutError', () =>
        Effect.fail(new TmdbError({ reason: 'timeout' })),
      ),
      Effect.map((result) => context.json(result)),
      Effect.catchTag('TmdbError', ({ reason, endpoint, status }) => {
        const messages = {
          configuration: 'Discovery is not configured yet.',
          authentication: 'Could not connect to TMDB.',
          'rate-limit': 'TMDB is busy. Try again shortly.',
          unavailable: 'Could not reach TMDB. Try again.',
          'invalid-response': 'TMDB returned incomplete data. Try again.',
          'invalid-filters':
            'These filters are unavailable. Clear them and try again.',
          empty: 'No new matches. Try fewer filters or pick again.',
          timeout: 'TMDB took too long to respond. Try again.',
        }
        if (reason === 'rate-limit') context.header('Retry-After', '30')
        return Effect.logError('TMDB request failed').pipe(
          Effect.annotateLogs({ reason, endpoint, status }),
          Effect.as(
            context.json(
              { error: messages[reason] },
              reason === 'invalid-filters'
                ? 400
                : reason === 'invalid-response' || reason === 'authentication'
                  ? 502
                  : 503,
            ),
          ),
        )
      }),
    ),
    { signal: context.req.raw.signal },
  )
}

api.notFound((context) => context.json({ error: 'Not found.' }, 404))
api.onError((_error, context) => {
  console.error('Unexpected discovery API failure')
  return context.json({ error: 'Could not load titles. Try again.' }, 500)
})
