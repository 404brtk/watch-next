import { Schema } from 'effect'
import { MediaPageSchema, MediaSchema } from './media'
import type { MediaType } from './media'

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
) {
  const query = new URLSearchParams({ exclude: excludedIds.join(',') })
  return request(`/api/${mediaType}/pick?${query}`, MediaSchema, signal)
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
