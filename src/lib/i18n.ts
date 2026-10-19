import { en } from './messages/en'
import { pl } from './messages/pl'

export type Language = 'en' | 'pl'
export const messages = { en, pl }
export const locales = { en: 'en-US', pl: 'pl-PL' }
export const languageCookie = 'watch-next-language'

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'pl'
}

export function requestCountry(request: Request) {
  const geo = 'cf' in request ? request.cf : null
  const country =
    geo && typeof geo === 'object' && 'country' in geo
      ? geo.country
      : request.headers.get('CF-IPCountry')
  return typeof country === 'string' && /^[A-Z]{2}$/.test(country)
    ? country
    : null
}

export function requestLanguage(request: Request): Language {
  const saved = request.headers
    .get('cookie')
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${languageCookie}=`))
    ?.slice(languageCookie.length + 1)
  return isLanguage(saved)
    ? saved
    : requestCountry(request) === 'PL'
      ? 'pl'
      : 'en'
}

export function formatRating(value: number, language: Language) {
  return value.toLocaleString(locales[language], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}
