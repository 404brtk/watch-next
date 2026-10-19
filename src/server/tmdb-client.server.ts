import { Data, Effect, Schema } from 'effect'

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

const ConfigurationSchema = Schema.Struct({
  images: Schema.Struct({
    secure_base_url: Schema.String,
    backdrop_sizes: Schema.Array(Schema.String),
    poster_sizes: Schema.Array(Schema.String),
  }),
})

let configuration:
  | { images: typeof ConfigurationSchema.Type.images; expiresAt: number }
  | undefined

export function request<A>(
  token: string,
  path: string,
  schema: Schema.Decoder<A>,
) {
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

export function imageConfiguration(token: string) {
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
      !images.backdrop_sizes.includes('w1280') ||
      !images.poster_sizes.includes('w342')
    ) {
      return yield* new TmdbError({ reason: 'invalid-response' })
    }
    configuration = { images, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
    return images
  })
}
