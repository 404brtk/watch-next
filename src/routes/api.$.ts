import type {} from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/server/api.server'

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request }) =>
        api.fetch(request, {
          TMDB_READ_ACCESS_TOKEN: process.env.TMDB_READ_ACCESS_TOKEN,
        }),
    },
  },
})
