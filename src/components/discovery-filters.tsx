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

type Choice = { id: number; name: string; logo?: string | null }

const filterTriggerClassName =
  'w-full min-w-0 justify-between gap-2 px-3 tabular-nums'

function MultipleFilter({
  label,
  emptyLabel,
  choices,
  value,
  onChange,
  disabled,
  children,
  maxSelections = 30,
}: {
  label: string
  emptyLabel: string
  choices: readonly Choice[]
  value: readonly number[]
  onChange: (value: number[]) => void
  disabled: boolean
  children?: ReactNode
  maxSelections?: number
}) {
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
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder={`Search ${label.toLowerCase()}…`}
        />
        <ComboboxEmpty>No matches. Try another name.</ComboboxEmpty>
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
            Choose up to {maxSelections}.
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
                Clear {label.toLowerCase()}
              </Button>
            )}
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

const lengths = [
  { value: null, label: 'Any length' },
  { value: 90, label: 'Under 90 min' },
  { value: 120, label: 'Under 2 hours' },
  { value: 180, label: 'Under 3 hours' },
]

function LengthFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Length: ${lengths.find((item) => item.value === value)?.label}`}
        className={filterTriggerClassName}
      >
        <span className="truncate">
          {lengths.find((item) => item.value === value)?.label}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverTitle>Length</PopoverTitle>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">Maximum movie length</legend>
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
              <span className="flex min-h-11 items-center justify-center rounded-xl border border-white/8 px-2 text-sm text-muted-foreground tabular-nums peer-checked:bg-accent peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-accent/50 hover:text-foreground peer-checked:hover:bg-accent">
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
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Minimum rating: ${value ? `${value.toFixed(1)} or higher` : 'Any rating'}`}
        className={filterTriggerClassName}
      >
        <span className="truncate">
          {value ? `${value.toFixed(1)}+ rating` : 'Any rating'}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div className="flex items-center justify-between gap-4">
          <PopoverTitle>Minimum rating</PopoverTitle>
          <output className="text-sm tabular-nums">
            {value ? `${value.toFixed(1)}+` : 'Any'}
          </output>
        </div>
        <Slider
          aria-label="Minimum rating"
          value={value}
          min={0}
          max={10}
          step={0.5}
          largeStep={1}
          onValueChange={(next) => {
            if (typeof next === 'number') onChange(next)
          }}
          getAriaValueText={(_formatted, next) =>
            next === 0 ? 'Any rating' : `${next} out of 10 or higher`
          }
        />
        <Button
          variant="ghost"
          className="min-h-11 w-fit px-2 text-muted-foreground"
          onClick={() => onChange(0)}
        >
          Any rating
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
  const { country } = useRegion()
  const filtered =
    value.genres.length > 0 ||
    value.providers.length > 0 ||
    value.maxRuntime !== null ||
    value.minRating > 0
  return (
    <fieldset className="relative w-full min-w-0 max-w-80 pb-13 md:max-w-190 md:px-16 md:pb-0">
      <legend className="sr-only">Filters for the next pick</legend>
      <div
        className={`grid grid-cols-2 gap-2.5 ${movies ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
      >
        <MultipleFilter
          label="Genres"
          emptyLabel="Any genre"
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
          label="Services"
          maxSelections={50}
          emptyLabel="Any service"
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
      <div className="absolute inset-x-0 bottom-0 flex justify-center md:inset-x-auto md:inset-e-0 md:top-0 md:bottom-auto">
        {filtered && (
          <Button
            variant="ghost"
            className="min-h-11 px-3 text-sm text-muted-foreground"
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
            Clear
          </Button>
        )}
      </div>
    </fieldset>
  )
}
