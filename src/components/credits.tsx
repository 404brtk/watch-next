import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import tmdbLogo from '@/assets/tmdb.svg'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '@/components/ui/popover'
import { useLanguage } from '@/components/language-provider'

function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const names = { en: 'English', pl: 'Polski' }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" />}
        aria-label={`${t.language}: ${names[language]}`}
        className="min-h-11 gap-2 border-transparent bg-transparent px-2 text-[13px] text-muted-foreground shadow-none"
      >
        <span lang={language}>{names[language]}</span>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-48 gap-2 p-2 text-start">
        <PopoverTitle className="px-3 pt-2 pb-1 text-sm text-muted-foreground">
          {t.language}
        </PopoverTitle>
        {(['pl', 'en'] as const).map((value) => (
          <Button
            key={value}
            variant="ghost"
            lang={value}
            aria-pressed={language === value}
            className="min-h-11 w-full justify-between rounded-xl px-3"
            onClick={() => {
              setLanguage(value)
              setOpen(false)
            }}
          >
            {names[value]}
            {language === value && (
              <Check className="size-4" aria-hidden="true" />
            )}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export function Credits() {
  const { t, notice } = useLanguage()
  return (
    <footer
      aria-label={t.credits}
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-5 pb-5 text-center"
    >
      <Dialog>
        <DialogTrigger className="min-h-11 rounded-sm px-2 text-[13px] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground">
          {t.filmDataFrom}
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{t.filmData}</DialogTitle>
          <DialogDescription>
            {t.filmDataNotice}{' '}
            <a href="https://www.themoviedb.org">The Movie Database (TMDB)</a>.
          </DialogDescription>
          <a
            href="https://www.themoviedb.org"
            className="flex min-h-11 w-fit items-center rounded-sm"
          >
            <img
              src={tmdbLogo}
              alt="TMDB"
              width={96}
              height={13}
              className="h-auto w-24"
            />
          </a>
          <p
            lang="en"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            This application uses TMDB and the TMDB APIs but is not endorsed,
            certified, or otherwise approved by TMDB.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.streamingNotice}{' '}
            <a
              href="https://www.justwatch.com"
              className="underline underline-offset-4"
            >
              JustWatch
            </a>
            .
          </p>
        </DialogContent>
      </Dialog>
      <LanguagePicker />
      <output className="w-full text-xs text-muted-foreground">{notice}</output>
    </footer>
  )
}
