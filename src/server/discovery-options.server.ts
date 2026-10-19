import { Effect, Schema } from 'effect'
import { CountryCodeSchema } from '../lib/discovery'
import type { Country, DiscoveryOptions } from '../lib/discovery'
import type { MediaType } from '../lib/media'
import { imageConfiguration, request, TmdbError } from './tmdb-client.server'
import { locales } from '../lib/i18n'
import type { Language } from '../lib/i18n'

const Id = Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))
const GenresSchema = Schema.Struct({
  genres: Schema.Array(Schema.Struct({ id: Id, name: Schema.String })),
})
export const RawProviderSchema = Schema.Struct({
  provider_id: Id,
  provider_name: Schema.String,
  logo_path: Schema.NullOr(
    Schema.String.check(Schema.isPattern(/^\/[a-zA-Z0-9._-]+$/)),
  ),
})
const ProvidersSchema = Schema.Struct({
  results: Schema.Array(RawProviderSchema),
})
export function normalizeProvider(
  provider: typeof RawProviderSchema.Type,
  imageBase: string,
) {
  return {
    id: provider.provider_id,
    name: provider.provider_name,
    logo: provider.logo_path ? `${imageBase}w92${provider.logo_path}` : null,
  }
}

const cache = new Map<string, { value: DiscoveryOptions; expiresAt: number }>()

let regions: { value: Country[]; expiresAt: number } | undefined
const RegionsResponseSchema = Schema.Struct({
  results: Schema.Array(
    Schema.Struct({
      iso_3166_1: CountryCodeSchema,
      english_name: Schema.String,
    }),
  ).check(Schema.isMinLength(1)),
})

export function availableRegions(token: string) {
  return Effect.gen(function* () {
    if (regions && regions.expiresAt > Date.now()) return regions.value
    const response = yield* request(
      token,
      '/watch/providers/regions?language=en-US',
      RegionsResponseSchema,
    )
    const value = response.results
      .map((region) => ({ code: region.iso_3166_1, name: region.english_name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    regions = { value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
    return value
  })
}

export function requireRegion(token: string, country: string) {
  return availableRegions(token).pipe(
    Effect.flatMap((countries) =>
      countries.some((region) => region.code === country)
        ? Effect.succeed(country)
        : Effect.fail(new TmdbError({ reason: 'invalid-filters' })),
    ),
  )
}

export function discoveryOptions(
  token: string,
  mediaType: MediaType,
  country: string | null,
  language: Language = 'en',
) {
  return Effect.gen(function* () {
    if (country) yield* requireRegion(token, country)
    const key = `${mediaType}:${country ?? ''}:${language}`
    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.value
    const [genres, providers] = yield* Effect.all(
      [
        request(
          token,
          `/genre/${mediaType}/list?language=${locales[language]}`,
          GenresSchema,
        ),
        country
          ? request(
              token,
              `/watch/providers/${mediaType}?language=${locales[language]}&watch_region=${country}`,
              ProvidersSchema,
            )
          : Effect.succeed({ results: [] }),
      ],
      { concurrency: 2 },
    )
    const imageBase = providers.results.length
      ? (yield* imageConfiguration(token)).secure_base_url
      : ''
    const value = {
      genres: genres.genres,
      providers: providers.results.map((provider) =>
        normalizeProvider(provider, imageBase),
      ),
    } satisfies DiscoveryOptions
    cache.set(key, { value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
    return value
  })
}
