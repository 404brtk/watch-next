import { Schema } from 'effect'

const Id = Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))

export const DiscoveryFiltersSchema = Schema.Struct({
  genres: Schema.Array(Id).check(Schema.isMaxLength(30)),
  providers: Schema.Array(Id).check(Schema.isMaxLength(50)),
  maxRuntime: Schema.NullOr(
    Schema.Number.check(
      Schema.isInt(),
      Schema.isGreaterThan(60),
      Schema.isLessThanOrEqualTo(360),
    ),
  ),
  minRating: Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 10 })),
})

export type DiscoveryFilters = typeof DiscoveryFiltersSchema.Type

export const defaultDiscoveryFilters: DiscoveryFilters = {
  genres: [],
  providers: [],
  maxRuntime: null,
  minRating: 0,
}

export const CountryCodeSchema = Schema.String.check(
  Schema.isPattern(/^[A-Z]{2}$/),
)
const CountrySchema = Schema.Struct({
  code: CountryCodeSchema,
  name: Schema.String,
})
export const RegionsSchema = Schema.Struct({
  countries: Schema.Array(CountrySchema),
  detectedCountry: Schema.NullOr(CountryCodeSchema),
})
export type Country = typeof CountrySchema.Type

export const ProviderSchema = Schema.Struct({
  id: Id,
  name: Schema.String,
  logo: Schema.NullOr(Schema.String),
})
export type Provider = typeof ProviderSchema.Type
const OptionSchema = Schema.Struct({ id: Id, name: Schema.String })
export const DiscoveryOptionsSchema = Schema.Struct({
  genres: Schema.Array(OptionSchema),
  providers: Schema.Array(ProviderSchema),
})
export type DiscoveryOptions = typeof DiscoveryOptionsSchema.Type

export const WatchAvailabilitySchema = Schema.Struct({
  link: Schema.NullOr(Schema.String),
  groups: Schema.Array(
    Schema.Struct({
      label: Schema.String,
      providers: Schema.Array(ProviderSchema),
    }),
  ),
})
export type WatchAvailability = typeof WatchAvailabilitySchema.Type
