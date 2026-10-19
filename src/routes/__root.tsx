import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { LanguageProvider, useLanguage } from '@/components/language-provider'
import { requestLanguage } from '@/lib/i18n'
import appCss from '../styles.css?url'

const initialLanguage = createServerFn({ method: 'GET' }).handler(() =>
  requestLanguage(getRequest()),
)

export const Route = createRootRoute({
  loader: async () => ({ language: await initialLanguage() }),
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Watch Next' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const data = Route.useLoaderData()
  return (
    <LanguageProvider initialLanguage={data?.language ?? 'en'}>
      <Document>{children}</Document>
    </LanguageProvider>
  )
}

function Document({ children }: { children: React.ReactNode }) {
  const { language, t } = useLanguage()
  return (
    <html lang={language} className="dark">
      <head>
        <meta name="description" content={t.description} />
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
