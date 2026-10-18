import cn from 'classnames'
import Link from 'next/link'
import { useId, useSyncExternalStore } from 'react'
import type { UseSessionResult } from '@/entities/session'
import {
  LANGUAGES,
  LANGUAGE_LABEL,
  getLanguageSnapshot,
  getServerLanguageSnapshot,
  subscribeToLanguage,
  useTranslation,
  writeLanguage,
} from '@/shared/lib/i18n'
import { ThemeToggle } from '@/features/toggle-theme'
import {
  HEADER_CONTROL_ACCENT,
  HEADER_CONTROL_ACCENT_BORDER,
  HEADER_CONTROL_CLASS,
  HEADER_CONTROL_PLAIN,
} from '@/shared/ui/headerControl'
import { SearchIcon, SettingsIcon, UserIcon } from '@/shared/ui/icons'
import { HeaderLogo } from '@/widgets/app-header/ui/HeaderLogo'
import { PanelButton, type PanelToggle } from '@/widgets/app-header/ui/PanelButton'

type AppHeaderProps = {
  activeNav?: 'home' | 'blocked' | 'other-stars' | 'account' | 'privacy'
  session: UseSessionResult
  settings?: PanelToggle
  results?: PanelToggle
}

function LanguageToggle() {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  )
  const t = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('header.language')}
      className="inline-flex gap-1 rounded-md border border-warm-300 p-0.5 dark:border-warm-600"
    >
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => writeLanguage(code)}
          aria-pressed={code === language}
          className={cn(
            'flex min-h-8 items-center justify-center rounded px-2 text-xs font-medium',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400',
            code === language
              ? 'bg-aubergine-700 text-white dark:bg-orange-500 dark:text-warm-950'
              : 'text-warm-700 hover:bg-warm-200 dark:text-warm-300 dark:hover:bg-warm-700',
          )}
        >
          {LANGUAGE_LABEL[code]}
        </button>
      ))}
    </div>
  )
}

function navLinkClassName(isActive: boolean): string {
  return cn(HEADER_CONTROL_CLASS, isActive ? HEADER_CONTROL_ACCENT : HEADER_CONTROL_PLAIN)
}

function LockedNavItem({ label, reasonId }: { label: string; reasonId: string }) {
  return (
    <span
      aria-disabled="true"
      aria-describedby={reasonId}
      className={cn(
        HEADER_CONTROL_CLASS,
        'cursor-not-allowed border-warm-200 text-warm-400 dark:border-warm-700 dark:text-warm-600',
      )}
    >
      {label}
    </span>
  )
}

const SECTIONS = [
  { nav: 'home', href: '/', labelKey: 'nav.farmNavigator' },
  { nav: 'blocked', href: '/blocked', labelKey: 'nav.blockedBases' },
  { nav: 'other-stars', href: '/other-stars', labelKey: 'nav.otherStars' },
] as const

export function AppHeader({ activeNav = 'home', session, settings, results }: AppHeaderProps) {
  const isAccount = activeNav === 'account'
  const t = useTranslation()
  const lockedReasonId = useId()
  const signedIn =
    session.status === 'user' || (session.status === 'unknown' && session.cachedLogin !== null)

  const label =
    session.status === 'user' && session.user !== null
      ? session.user.login
      : session.status === 'guest'
        ? t('nav.signIn')
        : (session.cachedLogin ?? t('nav.account'))

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-warm-300 pb-2 dark:border-warm-700">
      <h1 className="flex items-center text-lg font-semibold text-warm-900 dark:text-warm-50">
        {signedIn ? (
          <span className="flex items-center gap-1">
            <HeaderLogo />
            {t('app.title')}
          </span>
        ) : (
          <Link
            href="/"
            className={cn(
              'flex min-h-9 items-center gap-1 rounded-md',
              'hover:text-aubergine-700 focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-aubergine-700 dark:hover:text-orange-400',
              'dark:focus-visible:outline-orange-400',
            )}
          >
            <HeaderLogo />
            {t('app.title')}
          </Link>
        )}
      </h1>
      <nav className="flex flex-wrap gap-2" aria-label={t('nav.sections')}>
        {SECTIONS.map((section) =>
          signedIn ? (
            <Link
              key={section.nav}
              href={section.href}
              className={navLinkClassName(activeNav === section.nav)}
              aria-current={activeNav === section.nav ? 'page' : undefined}
            >
              {t(section.labelKey)}
            </Link>
          ) : (
            <LockedNavItem
              key={section.nav}
              label={t(section.labelKey)}
              reasonId={lockedReasonId}
            />
          ),
        )}
        {!signedIn && (
          <span
            id={lockedReasonId}
            className="flex min-h-9 items-center text-sm text-warm-700 dark:text-warm-300"
          >
            {t('nav.signInFirst')}
          </span>
        )}
        <Link
          href="/account"
          className={cn(
            HEADER_CONTROL_CLASS,
            isAccount ? HEADER_CONTROL_ACCENT : HEADER_CONTROL_ACCENT_BORDER,
          )}
          aria-current={isAccount ? 'page' : undefined}
        >
          <UserIcon />
          <span className="w-24 truncate text-center sm:w-[16ch]">{label}</span>
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <div
          role="group"
          aria-label={t('header.appearance')}
          className="inline-flex gap-1 rounded-md border border-warm-300 p-0.5 dark:border-warm-600"
        >
          <PanelButton
            panel={settings}
            icon={<SettingsIcon />}
            showLabel={t('header.showSettings')}
            hideLabel={t('header.hideSettings')}
            absentLabel={t('header.noSettingsHere')}
          />
          <PanelButton
            panel={results}
            icon={<SearchIcon />}
            showLabel={t('header.showSearch')}
            hideLabel={t('header.hideSearch')}
            absentLabel={t('header.noSearchHere')}
          />
        </div>
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </header>
  )
}
