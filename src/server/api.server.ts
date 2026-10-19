import { Effect } from 'effect'
import { Hono } from 'hono'
import { findTitles, pickTitle } from './tmdb.server'
import { TmdbError } from './tmdb-client.server'
import type { MediaPage, MediaTitle } from '../lib/media'

export const api = new Hono<{ Bindings: { TMDB_READ_ACCESS_TOKEN?: string } }>()

api.get('/api/:mediaType/:action', async (context) => {
  context.header('Cache-Control', 'no-store')
  const { mediaType, action } = context.req.param()
  if (
    (mediaType !== 'movie' && mediaType !== 'tv') ||
    !['pick', 'search', 'recommendations'].includes(action)
  ) {
    return context.json({ error: 'Not found.' }, 404)
  }
  const excluded = context.req.query('exclude') ?? ''
  const ids = excluded ? excluded.split(',').map(Number) : []
  const page = Number(context.req.query('page') ?? '1')
  const query = (context.req.query('query') ?? '').trim()
  const id = Number(context.req.query('id'))
  if (
    (action === 'pick' &&
      (excluded.length > 800 ||
        (excluded && !/^\d+(,\d+)*$/.test(excluded)) ||
        ids.length > 50 ||
        ids.some((id) => !Number.isSafeInteger(id) || id <= 0))) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 500 ||
    (action === 'search' && (!query || query.length > 200)) ||
    (action === 'recommendations' && (!Number.isSafeInteger(id) || id <= 0))
  )
    return context.json({ error: 'Invalid selection.' }, 400)

  const token = context.env.TMDB_READ_ACCESS_TOKEN?.trim()
  const operation: Effect.Effect<MediaTitle | MediaPage, TmdbError> = !token
    ? Effect.fail(new TmdbError({ reason: 'configuration' }))
    : action === 'pick'
      ? pickTitle(token, mediaType, ids)
      : findTitles(
          token,
          mediaType,
          page,
          action === 'search' ? { query } : { id },
        )

  return Effect.runPromise(
    operation.pipe(
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
          empty: 'No new titles found. Try again.',
          timeout: 'TMDB took too long to respond. Try again.',
        }
        if (reason === 'rate-limit') context.header('Retry-After', '30')
        return Effect.logError('TMDB request failed').pipe(
          Effect.annotateLogs({ reason, endpoint, status }),
          Effect.as(
            context.json(
              { error: messages[reason] },
              reason === 'invalid-response' || reason === 'authentication'
                ? 502
                : 503,
            ),
          ),
        )
      }),
    ),
    { signal: context.req.raw.signal },
  )
})

api.notFound((context) => context.json({ error: 'Not found.' }, 404))
api.onError((_error, context) => {
  console.error('Unexpected discovery API failure')
  return context.json({ error: 'Could not load titles. Try again.' }, 500)
})
