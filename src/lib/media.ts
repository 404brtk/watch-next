import { Schema } from 'effect'

export type MediaType = 'movie' | 'tv'

export const MediaSchema = Schema.Struct({
  id: Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)),
  mediaType: Schema.Literals(['movie', 'tv']),
  title: Schema.String,
  year: Schema.NullOr(Schema.Number),
  runtime: Schema.NullOr(Schema.Number),
  genres: Schema.Array(Schema.String),
  backdrop: Schema.NullOr(Schema.String),
  poster: Schema.NullOr(Schema.String),
  synopsis: Schema.String,
})

export type MediaTitle = typeof MediaSchema.Type

export const MediaPageSchema = Schema.Struct({
  results: Schema.Array(MediaSchema),
  page: Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)),
  totalPages: Schema.Number.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(0),
  ),
})
export type MediaPage = typeof MediaPageSchema.Type

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return [hours > 0 ? `${hours}h` : '', remainder > 0 ? `${remainder}m` : '']
    .filter(Boolean)
    .join(' ')
}

export function mediaMetadata(title: MediaTitle) {
  return [
    title.year?.toString(),
    title.mediaType === 'tv'
      ? 'TV series'
      : title.runtime
        ? formatRuntime(title.runtime)
        : null,
    title.genres[0],
  ].filter((value): value is string => Boolean(value))
}
