import { Schema } from 'effect'
import { MediaPageSchema, MediaSchema } from './media'
import type { MediaType } from './media'
import {
  DiscoveryOptionsSchema,
  RegionsSchema,
  WatchAvailabilitySchema,
} from './discovery'
import type { DiscoveryFilters } from './discovery'
import { messages } from './i18n'
import type { Language } from './i18n'

const ErrorSchema = Schema.Struct({ error: Schema.String })
export class MediaRequestError extends Error {}

async function request<A>(
  path: string,
  schema: Schema.Decoder<A>,
  signal: AbortSignal,
  language: Language,
): Promise<A> {
  const t = messages[language]
  const response = await fetch(
    `${path}${path.includes('?') ? '&' : '?'}language=${language}`,
    {
      signal: AbortSignal.any([signal, AbortSignal.timeout(25_000)]),
    },
  )
  const payload: unknown = await response.json()
  if (!response.ok) {
    throw new MediaRequestError(
      Schema.is(ErrorSchema)(payload) ? payload.error : t.titlesError,
    )
  }
  try {
    return Schema.decodeUnknownSync(schema)(payload)
  } catch {
    throw new MediaRequestError(t.unreadableData)
  }
}

export function fetchRandomTitle(
  mediaType: MediaType,
  excludedIds: readonly number[],
  signal: AbortSignal,
  filters: DiscoveryFilters,
  country: string | null = null,
  language: Language = 'en',
) {
  const query = new URLSearchParams({ exclude: excludedIds.join(',') })
  if (country) query.set('country', country)
  if (filters.genres.length) query.set('genres', filters.genres.join(','))
  if (filters.providers.length)
    query.set('providers', filters.providers.join(','))
  if (filters.maxRuntime !== null)
    query.set('maxRuntime', String(filters.maxRuntime))
  if (filters.minRating) query.set('minRating', String(filters.minRating))
  return request(
    `/api/${mediaType}/pick?${query}`,
    MediaSchema,
    signal,
    language,
  )
}

export function fetchDiscoveryOptions(
  mediaType: MediaType,
  signal: AbortSignal,
  country: string | null,
  language: Language = 'en',
) {
  const query = new URLSearchParams()
  if (country) query.set('country', country)
  return request(
    `/api/${mediaType}/options?${query}`,
    DiscoveryOptionsSchema,
    signal,
    language,
  )
}

export function fetchRegions(signal: AbortSignal, language: Language = 'en') {
  return request('/api/regions', RegionsSchema, signal, language)
}

export function fetchWatchAvailability(
  mediaType: MediaType,
  id: number,
  country: string,
  signal: AbortSignal,
  language: Language = 'en',
) {
  return request(
    `/api/${mediaType}/watch?${new URLSearchParams({ id: String(id), country })}`,
    WatchAvailabilitySchema,
    signal,
    language,
  )
}

export function fetchTitleDetails(
  mediaType: MediaType,
  id: number,
  signal: AbortSignal,
  language: Language = 'en',
) {
  return request(
    `/api/${mediaType}/details?id=${id}`,
    MediaSchema,
    signal,
    language,
  )
}

export function fetchTitles(
  mediaType: MediaType,
  selection: { query: string } | { id: number },
  page: number,
  signal: AbortSignal,
  language: Language = 'en',
) {
  const query = new URLSearchParams({ page: String(page) })
  if ('query' in selection) query.set('query', selection.query)
  else query.set('id', String(selection.id))
  return request(
    `/api/${mediaType}/${'query' in selection ? 'search' : 'recommendations'}?${query}`,
    MediaPageSchema,
    signal,
    language,
  )
}
