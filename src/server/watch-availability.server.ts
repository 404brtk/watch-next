import { Effect, Schema } from 'effect'
import type { MediaType } from '../lib/media'
import type { WatchAvailability } from '../lib/discovery'
import {
  normalizeProvider,
  RawProviderSchema,
  requireRegion,
} from './discovery-options.server'
import { imageConfiguration, request } from './tmdb-client.server'

const Providers = Schema.optional(Schema.Array(RawProviderSchema))
const CountryAvailabilitySchema = Schema.Struct({
  link: Schema.String.check(
    Schema.isPattern(/^https:\/\/www\.themoviedb\.org\//),
  ),
  flatrate: Providers,
  free: Providers,
  ads: Providers,
  rent: Providers,
  buy: Providers,
})
const ResponseSchema = Schema.Struct({
  results: Schema.Record(Schema.String, CountryAvailabilitySchema),
})
const cache = new Map<
  string,
  { value: typeof ResponseSchema.Type; expiresAt: number }
>()

export function watchAvailability(
  token: string,
  mediaType: MediaType,
  id: number,
  country: string,
) {
  return Effect.gen(function* () {
    yield* requireRegion(token, country)
    const key = `${mediaType}:${id}`
    const cached = cache.get(key)
    const response =
      cached && cached.expiresAt > Date.now()
        ? cached.value
        : yield* request(
            token,
            `/${mediaType}/${id}/watch/providers`,
            ResponseSchema,
          )
    if (response !== cached?.value) {
      if (cache.size >= 100) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
      }
      cache.set(key, {
        value: response,
        expiresAt: Date.now() + 60 * 60 * 1000,
      })
    }
    const available = response.results[country]
    if (!available)
      return { link: null, groups: [] } satisfies WatchAvailability
    const images = yield* imageConfiguration(token)
    const categories = [
      { label: 'Subscriptions', providers: available.flatrate ?? [] },
      {
        label: 'Free',
        providers: [...(available.free ?? []), ...(available.ads ?? [])],
      },
      { label: 'Rent', providers: available.rent ?? [] },
      { label: 'Buy', providers: available.buy ?? [] },
    ]
    return {
      link: available.link,
      groups: categories
        .filter((group) => group.providers.length)
        .map((group) => ({
          label: group.label,
          providers: [
            ...new Map(
              group.providers.map((provider) => [
                provider.provider_id,
                normalizeProvider(provider, images.secure_base_url),
              ]),
            ).values(),
          ],
        })),
    } satisfies WatchAvailability
  })
}
