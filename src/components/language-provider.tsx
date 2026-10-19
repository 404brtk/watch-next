import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { languageCookie, messages } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
  notice: string | null
} | null>(null)

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language
  children: ReactNode
}) {
  const [language, setCurrentLanguage] = useState(initialLanguage)
  const [remembered, setRemembered] = useState(true)

  function setLanguage(next: Language) {
    setCurrentLanguage(next)
    try {
      document.cookie = `${languageCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      setRemembered(
        document.cookie
          .split(';')
          .some((cookie) => cookie.trim() === `${languageCookie}=${next}`),
      )
    } catch {
      setRemembered(false)
    }
  }

  return (
    <LanguageContext
      value={{
        language,
        setLanguage,
        notice: remembered ? null : messages[language].rememberLanguageError,
      }}
    >
      {children}
    </LanguageContext>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage requires LanguageProvider')
  return { ...context, t: messages[context.language] }
}
