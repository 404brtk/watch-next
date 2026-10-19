import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFieldLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { CountryPicker } from '@/components/country-picker'
import { ProviderLogo } from '@/components/provider-logo'
import { useRegion } from '@/components/region-provider'
import { defaultDiscoveryFilters } from '@/lib/discovery'
import type { DiscoveryFilters, DiscoveryOptions } from '@/lib/discovery'
import { useLanguage } from '@/components/language-provider'
import { formatRating } from '@/lib/i18n'

type Choice = { id: number; name: string; logo?: string | null }

const filterTriggerClassName =
  'w-full min-w-0 justify-between gap-2 px-3 tabular-nums'

function MultipleFilter({
  label,
  emptyLabel,
  searchLabel,
  clearLabel,
  choices,
  value,
  onChange,
  disabled,
  children,
  maxSelections = 30,
}: {
  label: string
  emptyLabel: string
  searchLabel: string
  clearLabel: string
  choices: readonly Choice[]
  value: readonly number[]
  onChange: (value: number[]) => void
  disabled: boolean
  children?: ReactNode
  maxSelections?: number
}) {
  const { t } = useLanguage()
  const selected = choices.filter((item) => value.includes(item.id))
  const summary = selected.length
    ? `${selected[0].name}${selected.length > 1 ? ` +${selected.length - 1}` : ''}`
    : emptyLabel
  return (
    <Combobox<Choice, true>
      multiple
      items={choices}
      value={selected}
      onValueChange={(next) => onChange(next.map((item) => item.id))}
      itemToStringLabel={(item) => item.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
    >
      <ComboboxFieldLabel className="sr-only">{label}</ComboboxFieldLabel>
      <ComboboxTrigger
        aria-label={`${label}: ${selected.map((item) => item.name).join(', ') || emptyLabel}`}
        className={filterTriggerClassName}
      >
        <ComboboxValue>
          <span className="min-w-0 truncate">{summary}</span>
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          aria-label={searchLabel}
          placeholder={`${searchLabel}…`}
        />
        <ComboboxEmpty>{t.noOptions}</ComboboxEmpty>
        <ComboboxList>
          {(item: Choice) => (
            <ComboboxItem
              key={item.id}
              value={item}
              disabled={
                selected.length >= maxSelections && !value.includes(item.id)
              }
            >
              {'logo' in item && (
                <ProviderLogo provider={{ ...item, logo: item.logo ?? null }} />
              )}
              <span className="min-w-0 wrap-break-word">{item.name}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
        {selected.length >= maxSelections && (
          <p className="px-4 py-2 text-sm text-muted-foreground">
            {t.maxSelections(maxSelections)}
          </p>
        )}
        {(selected.length > 0 || children) && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/6 px-2 py-1">
            {children}
            {selected.length > 0 && (
              <Button
                variant="ghost"
                className="min-h-11 px-3 text-sm text-muted-foreground"
                onClick={() => onChange([])}
              >
                {clearLabel}
              </Button>
            )}
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

function LengthFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const { t } = useLanguage()
  const lengths = [
    { value: null, label: t.anyLength },
    { value: 90, label: t.under90 },
    { value: 120, label: t.under120 },
    { value: 180, label: t.under180 },
  ]
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${t.length}: ${lengths.find((item) => item.value === value)?.label}`}
        className={filterTriggerClassName}
      >
        <span className="truncate">
          {value === null
            ? t.lengthPlaceholder
            : lengths.find((item) => item.value === value)?.label}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverTitle>{t.length}</PopoverTitle>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">{t.maximumLength}</legend>
          {lengths.map((item) => (
            <label key={item.label} className="relative cursor-pointer">
              <input
                type="radio"
                name="movie-length"
                checked={value === item.value}
                className="peer sr-only"
                onChange={() => {
                  onChange(item.value)
                }}
                onClick={(event) => {
                  if (event.detail > 0) setOpen(false)
                }}
              />
              <span className="flex min-h-11 items-center justify-center rounded-xl border border-white/8 px-2 text-center text-sm text-muted-foreground tabular-nums peer-checked:bg-accent peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-accent/50 hover:text-foreground peer-checked:hover:bg-accent">
                {item.label}
              </span>
            </label>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  )
}

function RatingFilter({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const { language, t } = useLanguage()
  const rating = formatRating(value, language)
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${t.minimumRating}: ${value ? t.ratingMinimum(rating) : t.anyRating}`}
        className={filterTriggerClassName}
      >
        <span className="truncate">
          {value ? t.ratingFilter(rating) : t.ratingPlaceholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div className="flex items-center justify-between gap-4">
          <PopoverTitle>{t.minimumRating}</PopoverTitle>
          <output className="text-sm tabular-nums">
            {value ? `${rating}+` : t.any}
          </output>
        </div>
        <Slider
          aria-label={t.minimumRating}
          value={value}
          min={0}
          max={10}
          step={0.5}
          largeStep={1}
          onValueChange={(next) => {
            if (typeof next === 'number') onChange(next)
          }}
          getAriaValueText={(_formatted, next) =>
            next === 0
              ? t.anyRating
              : t.ratingMinimum(formatRating(next, language))
          }
        />
        <Button
          variant="ghost"
          className="min-h-11 w-fit px-2 text-muted-foreground"
          onClick={() => onChange(0)}
        >
          {t.anyRating}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function DiscoveryFilters({
  value,
  onChange,
  options,
  movies,
}: {
  value: DiscoveryFilters
  onChange: (value: DiscoveryFilters) => void
  options: DiscoveryOptions | null
  movies: boolean
}) {
  const { t } = useLanguage()
  const { country } = useRegion()
  const filtered =
    value.genres.length > 0 ||
    value.providers.length > 0 ||
    value.maxRuntime !== null ||
    value.minRating > 0
  return (
    <fieldset className="grid w-full min-w-0 max-w-80 items-start gap-2.5 md:max-w-none md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-3">
      <legend className="sr-only">{t.filters}</legend>
      <div
        className={`grid grid-cols-2 gap-2.5 ${movies ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
      >
        <MultipleFilter
          label={t.genres}
          emptyLabel={t.anyGenre}
          searchLabel={t.searchGenres}
          clearLabel={t.clearGenres}
          choices={options?.genres ?? []}
          value={value.genres}
          onChange={(genres) => onChange({ ...value, genres })}
          disabled={!options}
        />
        {movies && (
          <LengthFilter
            value={value.maxRuntime}
            onChange={(maxRuntime) => onChange({ ...value, maxRuntime })}
          />
        )}
        <MultipleFilter
          label={t.services}
          searchLabel={t.searchServices}
          clearLabel={t.clearServices}
          maxSelections={50}
          emptyLabel={t.anyService}
          choices={country ? (options?.providers ?? []) : []}
          value={value.providers}
          onChange={(providers) => onChange({ ...value, providers })}
          disabled={!options}
        >
          <CountryPicker />
        </MultipleFilter>
        <RatingFilter
          value={value.minRating}
          onChange={(minRating) => onChange({ ...value, minRating })}
        />
      </div>
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className={`min-h-11 px-3 text-sm text-muted-foreground${filtered ? '' : ' invisible'}`}
          disabled={!filtered}
          onClick={(event) => {
            onChange(defaultDiscoveryFilters)
            event.currentTarget
              .closest('fieldset')
              ?.querySelector<HTMLButtonElement>(
                '[data-slot="combobox-trigger"]',
              )
              ?.focus()
          }}
        >
          {t.clear}
        </Button>
      </div>
    </fieldset>
  )
}
