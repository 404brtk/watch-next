import { useRegion } from '@/components/region-provider'
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
import type { Country } from '@/lib/discovery'
import { useLanguage } from '@/components/language-provider'

export function CountryPicker() {
  const { t } = useLanguage()
  const { country, countries, setCountry, error, notice, retry } = useRegion()
  const selected = countries.find((item) => item.code === country) ?? null
  if (error)
    return (
      <div className="text-sm text-muted-foreground">
        <p role="alert">{t.countriesError}</p>
        <Button variant="ghost" className="min-h-11" onClick={retry}>
          {t.retry}
        </Button>
      </div>
    )
  return (
    <div className="min-w-0">
      <Combobox<Country>
        items={countries}
        value={selected}
        onValueChange={(next) => {
          if (next) setCountry(next.code)
        }}
        itemToStringLabel={(item) => item.name}
        isItemEqualToValue={(a, b) => a.code === b.code}
      >
        <ComboboxFieldLabel className="sr-only">
          {t.watchCountry}
        </ComboboxFieldLabel>
        <ComboboxTrigger
          disabled={!countries.length}
          aria-label={`${t.watchCountry}: ${selected?.name ?? t.chooseCountry}`}
          className="h-auto min-h-11 border-transparent bg-transparent px-2 text-sm text-muted-foreground shadow-none"
        >
          <ComboboxValue>
            <span className="min-w-0 max-w-44 truncate">
              {selected?.name ??
                (countries.length ? t.chooseCountry : t.loadingCountries)}
            </span>
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput
            aria-label={t.searchCountries}
            placeholder={`${t.searchCountries}…`}
          />
          <ComboboxEmpty>{t.noCountries}</ComboboxEmpty>
          <ComboboxList>
            {(item: Country) => (
              <ComboboxItem key={item.code} value={item}>
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {notice && (
        <output className="max-w-64 text-xs text-muted-foreground">
          {notice}
        </output>
      )}
    </div>
  )
}
