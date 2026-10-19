import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, Shuffle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RandomPicker } from '@/components/random-picker'
import { SimilarFinder } from '@/components/similar-finder'
import { Credits } from '@/components/credits'
import { RegionProvider } from '@/components/region-provider'
import type { MediaType } from '@/lib/media'
import { useLanguage } from '@/components/language-provider'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { t } = useLanguage()
  const [mediaType, setMediaType] = useState<MediaType>('movie')
  const [mode, setMode] = useState('random')
  return (
    <RegionProvider>
      <div className="relative isolate flex min-h-svh flex-col bg-(image:--canvas-gradient) before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:bg-(--texture) before:opacity-16 before:[mask:url('/dither.svg')_center/1440px_960px_repeat]">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pt-7 pb-10 sm:px-8 sm:pt-12">
          <Tabs
            value={mode}
            onValueChange={(value) => {
              if (typeof value === 'string') setMode(value)
            }}
            className="flex-1 gap-9 sm:gap-12"
          >
            <div className="mx-auto flex w-full max-w-240 flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-between">
              <TabsList aria-label={t.discover}>
                <TabsTrigger value="random">
                  <Shuffle
                    className="size-4"
                    aria-hidden="true"
                    strokeWidth={1.75}
                  />
                  {t.random}
                </TabsTrigger>
                <TabsTrigger value="similar">
                  <Search
                    className="size-4"
                    aria-hidden="true"
                    strokeWidth={1.75}
                  />
                  {t.similar}
                </TabsTrigger>
              </TabsList>
              <fieldset className="flex max-w-full flex-wrap items-center gap-1 rounded-[26px] border border-white/8 bg-background/80 p-1 shadow-[inset_0_1px_0_var(--surface-edge)] backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-background [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none forced-colors:border-[ButtonText]">
                <legend className="sr-only">{t.whatToWatch}</legend>
                {(['movie', 'tv'] as const).map((type) => (
                  <label key={type} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="media-type"
                      value={type}
                      checked={mediaType === type}
                      onChange={() => setMediaType(type)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground peer-checked:bg-muted/70 peer-checked:text-foreground peer-checked:shadow-[inset_0_0_0_1px_var(--surface-edge),inset_0_1px_0_var(--surface-highlight)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:text-foreground forced-colors:peer-checked:outline">
                      {type === 'movie' ? t.movies : t.shows}
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
            <TabsContent
              value="random"
              keepMounted
              className="content-center data-hidden:hidden"
            >
              <RandomPicker
                key={mediaType}
                mediaType={mediaType}
                active={mode === 'random'}
              />
            </TabsContent>
            <TabsContent
              value="similar"
              keepMounted
              className="pt-4 data-hidden:hidden sm:pt-8"
            >
              <SimilarFinder key={mediaType} mediaType={mediaType} />
            </TabsContent>
          </Tabs>
        </main>
        <Credits />
      </div>
    </RegionProvider>
  )
}
