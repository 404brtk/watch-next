import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Country } from '@/lib/discovery'
import { fetchRegions, MediaRequestError } from '@/lib/media-client'

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
  const [country, setCountryCode] = useState<string | null>(null)
  const [countries, setCountries] = useState<readonly Country[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
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
          setNotice('Country choices cannot be remembered in this browser.')
        }
        const preferred = data.countries.some((item) => item.code === saved)
          ? saved
          : data.detectedCountry
        setCountries(data.countries)
        setCountryCode((current) => current ?? preferred)
        setError(null)
      },
      (cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof MediaRequestError
              ? cause.message
              : 'Could not load countries. Try again.',
          )
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
      setNotice(null)
    } catch {
      setNotice('Country choices cannot be remembered in this browser.')
    }
  }

  return (
    <RegionContext
      value={{
        country,
        countries,
        error,
        notice,
        setCountry,
        retry: () => {
          setError(null)
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
