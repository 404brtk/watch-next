import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Country } from '@/lib/discovery'
import { fetchRegions } from '@/lib/media-client'
import { useLanguage } from '@/components/language-provider'
import { locales } from '@/lib/i18n'

type RegionContextValue = {
  country: string | null
  countries: readonly Country[]
  error: string | null
  notice: string | null
  setCountry: (country: string) => void
  retry: () => void
}
const RegionContext = createContext<RegionContextValue | null>(null)
const preferenceKey = 'watch-next-country'

export function RegionProvider({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage()
  const [country, setCountryCode] = useState<string | null>(null)
  const [countries, setCountries] = useState<readonly Country[]>([])
  const [error, setError] = useState(false)
  const [notice, setNotice] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    void fetchRegions(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return
        let saved: string | null = null
        try {
          saved = localStorage.getItem(preferenceKey)
        } catch {
          setNotice(true)
        }
        const preferred = data.countries.some((item) => item.code === saved)
          ? saved
          : data.detectedCountry
        setCountries(data.countries)
        setCountryCode((current) => current ?? preferred)
        setError(false)
      },
      () => {
        if (!controller.signal.aborted) setError(true)
      },
    )
    return () => controller.abort()
  }, [attempt])

  function setCountry(next: string) {
    if (!countries.some((item) => item.code === next))
      throw new Error('Unsupported watch region')
    setCountryCode(next)
    try {
      localStorage.setItem(preferenceKey, next)
      setNotice(false)
    } catch {
      setNotice(true)
    }
  }

  const localizedCountries = useMemo(() => {
    const names = new Intl.DisplayNames(locales[language], { type: 'region' })
    return countries
      .map((item) => ({ ...item, name: names.of(item.code) ?? item.name }))
      .sort((a, b) => a.name.localeCompare(b.name, locales[language]))
  }, [countries, language])

  return (
    <RegionContext
      value={{
        country,
        countries: localizedCountries,
        error: error ? t.countriesError : null,
        notice: notice ? t.rememberCountryError : null,
        setCountry,
        retry: () => {
          setError(false)
          setAttempt((value) => value + 1)
        },
      }}
    >
      {children}
    </RegionContext>
  )
}

export function useRegion() {
  const context = useContext(RegionContext)
  if (!context) throw new Error('useRegion requires RegionProvider')
  return context
}
