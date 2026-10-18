import { Schema } from 'effect'

export const MovieSchema = Schema.Struct({
  id: Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)),
  title: Schema.String,
  year: Schema.NullOr(Schema.Number),
  runtime: Schema.NullOr(Schema.Number),
  genres: Schema.Array(Schema.String),
  backdrop: Schema.NullOr(Schema.String),
  synopsis: Schema.String,
})

export type Movie = typeof MovieSchema.Type

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return [hours > 0 ? `${hours}h` : '', remainder > 0 ? `${remainder}m` : '']
    .filter(Boolean)
    .join(' ')
}

export function movieMetadata(movie: Movie) {
  return [
    movie.year?.toString(),
    movie.runtime ? formatRuntime(movie.runtime) : null,
    movie.genres[0],
  ].filter((value): value is string => Boolean(value))
}
