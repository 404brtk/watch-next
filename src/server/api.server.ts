import { Effect } from 'effect'
import { Hono } from 'hono'
import { pickMovie } from './tmdb.server.ts'

export const api = new Hono<{ Bindings: { TMDB_READ_ACCESS_TOKEN?: string } }>()

api.get('/api/movies/pick', async (context) => {
  const excluded = context.req.query('exclude') ?? ''
  if (excluded.length > 800 || (excluded && !/^\d+(,\d+)*$/.test(excluded))) {
    return context.json({ error: 'Invalid movie selection.' }, 400)
  }
  const ids = excluded ? excluded.split(',').map(Number) : []
  if (
    ids.length > 50 ||
    ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
  ) {
    return context.json({ error: 'Invalid movie selection.' }, 400)
  }
  context.header('Cache-Control', 'no-store')
  return Effect.runPromise(
    pickMovie(context.env.TMDB_READ_ACCESS_TOKEN, ids).pipe(
      Effect.map((movie) => context.json(movie)),
      Effect.catchTag('TmdbError', ({ reason, endpoint, status }) => {
        const messages = {
          configuration: 'Movie discovery is not configured yet.',
          authentication: 'Movie discovery could not connect to TMDB.',
          'rate-limit': 'TMDB is busy. Please try again shortly.',
          unavailable: 'Could not reach TMDB. Please try again.',
          'invalid-response':
            'TMDB returned incomplete movie data. Please try again.',
          empty: 'No new movies found. Please try again.',
          timeout: 'TMDB took too long to respond. Please try again.',
        }
        if (reason === 'rate-limit') context.header('Retry-After', '30')
        return Effect.logError('Movie discovery failed').pipe(
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
  console.error('Unexpected movie API failure')
  return context.json(
    { error: 'Could not load a movie. Please try again.' },
    500,
  )
})
