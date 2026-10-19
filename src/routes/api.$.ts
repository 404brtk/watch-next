import type {} from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { api } from '@/server/api.server'

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request }) => api.fetch(request, env),
    },
  },
})
