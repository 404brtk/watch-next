import { Schema } from 'effect'
import { MediaPageSchema, MediaSchema } from './media'
import type { MediaType } from './media'
import {
  DiscoveryOptionsSchema,
  RegionsSchema,
  WatchAvailabilitySchema,
} from './discovery'
import type { DiscoveryFilters } from './discovery'

const ErrorSchema = Schema.Struct({ error: Schema.String })
export class MediaRequestError extends Error {}

async function request<A>(
  path: string,
  schema: Schema.Decoder<A>,
  signal: AbortSignal,
): Promise<A> {
  const response = await fetch(path, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(25_000)]),
  })
  const payload: unknown = await response.json()
  if (!response.ok) {
    throw new MediaRequestError(
      Schema.is(ErrorSchema)(payload)
        ? payload.error
        : 'Could not load titles. Try again.',
    )
  }
  try {
    return Schema.decodeUnknownSync(schema)(payload)
  } catch {
    throw new MediaRequestError('Title data could not be read. Try again.')
  }
}

export function fetchRandomTitle(
  mediaType: MediaType,
  excludedIds: readonly number[],
  signal: AbortSignal,
  filters: DiscoveryFilters,
  country: string | null = null,
) {
  const query = new URLSearchParams({ exclude: excludedIds.join(',') })
  if (country) query.set('country', country)
  if (filters.genres.length) query.set('genres', filters.genres.join(','))
  if (filters.providers.length)
    query.set('providers', filters.providers.join(','))
  if (filters.maxRuntime !== null)
    query.set('maxRuntime', String(filters.maxRuntime))
  if (filters.minRating) query.set('minRating', String(filters.minRating))
  return request(`/api/${mediaType}/pick?${query}`, MediaSchema, signal)
}

export function fetchDiscoveryOptions(
  mediaType: MediaType,
  signal: AbortSignal,
  country: string | null,
) {
  const query = new URLSearchParams()
  if (country) query.set('country', country)
  return request(
    `/api/${mediaType}/options?${query}`,
    DiscoveryOptionsSchema,
    signal,
  )
}

export function fetchRegions(signal: AbortSignal) {
  return request('/api/regions', RegionsSchema, signal)
}

export function fetchWatchAvailability(
  mediaType: MediaType,
  id: number,
  country: string,
  signal: AbortSignal,
) {
  return request(
    `/api/${mediaType}/watch?${new URLSearchParams({ id: String(id), country })}`,
    WatchAvailabilitySchema,
    signal,
  )
}

export function fetchTitleDetails(
  mediaType: MediaType,
  id: number,
  signal: AbortSignal,
) {
  return request(`/api/${mediaType}/details?id=${id}`, MediaSchema, signal)
}

export function fetchTitles(
  mediaType: MediaType,
  selection: { query: string } | { id: number },
  page: number,
  signal: AbortSignal,
) {
  const query = new URLSearchParams({ page: String(page) })
  if ('query' in selection) query.set('query', selection.query)
  else query.set('id', String(selection.id))
  return request(
    `/api/${mediaType}/${'query' in selection ? 'search' : 'recommendations'}?${query}`,
    MediaPageSchema,
    signal,
  )
}
