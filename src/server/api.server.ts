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
import {
  isLanguage,
  messages,
  requestCountry,
  requestLanguage,
} from '../lib/i18n'

type ApiEnv = { Bindings: { TMDB_READ_ACCESS_TOKEN?: string } }
export const api = new Hono<ApiEnv>()
api.use('/api/*', async (context, next) => {
  context.header('Cache-Control', 'no-store')
  const language = context.req.query('language')
  if (language !== undefined && !isLanguage(language))
    return context.json(
      { error: messages[requestLanguage(context.req.raw)].invalidSelection },
      400,
    )
  await next()
})

api.get('/api/regions', (context) =>
  execute(context, (token) =>
    availableRegions(token).pipe(
      Effect.map((countries) => {
        const hint = requestCountry(context.req.raw)
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
  const language = apiLanguage(context)
  const t = messages[language]
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
    return context.json({ error: t.notFound }, 404)
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
    return context.json({ error: t.invalidSelection }, 400)

  if (action === 'watch') {
    if (!country) return context.json({ error: t.chooseCountry }, 400)
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
        ? pickTitle(token, mediaType, ids, filters, country, language)
        : action === 'options'
          ? discoveryOptions(token, mediaType, country, language)
          : action === 'details'
            ? titleDetails(token, mediaType, id, language)
            : findTitles(
                token,
                mediaType,
                page,
                action === 'search' ? { query } : { id },
                language,
              )

    return operation
  })
})

function apiLanguage(context: Context<ApiEnv>) {
  const language = context.req.query('language')
  return isLanguage(language) ? language : requestLanguage(context.req.raw)
}

function execute<A>(
  context: Context<ApiEnv>,
  operation: (token: string) => Effect.Effect<A, TmdbError>,
) {
  const t = messages[apiLanguage(context)]
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
        if (reason === 'rate-limit') context.header('Retry-After', '30')
        return Effect.logError('TMDB request failed').pipe(
          Effect.annotateLogs({ reason, endpoint, status }),
          Effect.as(
            context.json(
              { error: t.apiErrors[reason] },
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

api.notFound((context) =>
  context.json({ error: messages[apiLanguage(context)].notFound }, 404),
)
api.onError((_error, context) => {
  console.error('Unexpected discovery API failure')
  return context.json(
    { error: messages[apiLanguage(context)].titlesError },
    500,
  )
})
