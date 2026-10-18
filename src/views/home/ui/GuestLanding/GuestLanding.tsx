'use client'

import cn from 'classnames'
import { withBasePath } from '@/shared/config/basePath'
import { en } from '@/shared/lib/i18n/dictionary/en'
import { ru } from '@/shared/lib/i18n/dictionary/ru'
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch'

function Bilingual({ k }: { k: keyof typeof en }) {
  return (
    <>
      <span lang="en" data-lang="en">
        {en[k]}
      </span>
      <span lang="ru" data-lang="ru">
        {ru[k]}
      </span>
    </>
  )
}

export function GuestLanding() {
  return (
    <div
      data-guest-only
      className="flex min-h-dvh flex-col bg-warm-50 text-warm-900 dark:bg-warm-950 dark:text-warm-100"
    >
      <div className="flex justify-end p-2">
        <LanguageSwitch />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <img
          src={withBasePath('/station_black.png')}
          alt=""
          width={1254}
          height={1254}
          className="h-auto w-40 dark:hidden sm:w-48"
        />
        <img
          src={withBasePath('/station_white.png')}
          alt=""
          width={1254}
          height={1254}
          className="hidden h-auto w-40 dark:block sm:w-48"
        />

        <h1 className="text-base font-medium">
          <Bilingual k="landing.title" />
        </h1>

        <a
          href={withBasePath('/account/')}
          className={cn(
            'flex min-h-11 items-center justify-center px-2 text-sm underline underline-offset-4',
            'hover:text-aubergine-700 focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-aubergine-700 dark:hover:text-orange-400 dark:focus-visible:outline-orange-400',
          )}
        >
          <Bilingual k="landing.go" />
        </a>
      </main>

      <footer className="px-4 pb-4 text-center">
        <details className="text-xs text-warm-600 dark:text-warm-400">
          <summary className="inline-flex min-h-11 cursor-pointer items-center justify-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400">
            <Bilingual k="landing.cookies" />
          </summary>
          <p className="mx-auto max-w-prose pb-2">
            <Bilingual k="landing.cookiesText" />
          </p>
        </details>
      </footer>
    </div>
  )
}
