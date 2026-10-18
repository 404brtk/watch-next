import { Schema } from 'effect'
import { MovieSchema } from './movies'

const ErrorSchema = Schema.Struct({ error: Schema.String })

export class MovieRequestError extends Error {}

export async function fetchMovie(
  excludedIds: readonly number[],
  signal: AbortSignal,
) {
  const query = new URLSearchParams({ exclude: excludedIds.join(',') })
  const response = await fetch(`/api/movies/pick?${query}`, { signal })
  const payload: unknown = await response.json()
  if (!response.ok) {
    throw new MovieRequestError(
      Schema.is(ErrorSchema)(payload)
        ? payload.error
        : 'Could not load a movie. Please try again.',
    )
  }
  try {
    return Schema.decodeUnknownSync(MovieSchema)(payload)
  } catch {
    throw new MovieRequestError(
      'Movie data could not be read. Please try again.',
    )
  }
}
