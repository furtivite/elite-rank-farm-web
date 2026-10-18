'use client'

import cn from 'classnames'
import { useSyncExternalStore, type ReactNode } from 'react'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { UseSessionResult } from '@/entities/session'
import type { FarmMode } from '@/features/farm-recommender'
import {
  getServerResultsPanelSnapshot,
  getResultsPanelSnapshot,
  getServerSettingsPanelSnapshot,
  getSettingsPanelSnapshot,
  setResultsPanelVisible,
  setSettingsPanelVisible,
  subscribeToResultsPanel,
  subscribeToSettingsPanel,
} from '@/shared/lib/settingsPanel'
import { withBasePath } from '@/shared/config/basePath'
import { HEADER_CONTROL_ACCENT, HEADER_CONTROL_CLASS } from '@/shared/ui/headerControl'
import { AgentUpdateBanner } from '@/widgets/agent-update-banner'
import { useTranslation } from '@/shared/lib/i18n'
import { columnsGridClass } from '@/widgets/app-shell/lib/columnsGridClass'
import { useSharedStores } from '@/widgets/app-shell/model/useSharedStores'
import { AppHeader } from '@/widgets/app-header'
import { MockStatePanel } from '@/features/mock-state'
import { CommanderPanel } from '@/widgets/commander-panel'
import { CommanderHeading } from '@/widgets/app-shell/ui/CommanderHeading'

type AppShellProps = {
  activeNav: 'home' | 'blocked' | 'other-stars' | 'account' | 'privacy'
  commander: UseCommanderStateResult
  farmMode?: FarmMode
  session: UseSessionResult
  withSettings?: boolean
  aside?: ReactNode
  notice?: ReactNode
  children: ReactNode
}

const SETTINGS_COLUMN_ID = 'settings-column'
const RESULTS_COLUMN_ID = 'results-column'
const ASIDE_COLUMN_ID = 'basket-column'

export function AppShell({
  farmMode,
  activeNav,
  commander,
  session,
  withSettings = true,
  aside,
  notice,
  children,
}: AppShellProps) {
  const showSettings = useSyncExternalStore(
    subscribeToSettingsPanel,
    getSettingsPanelSnapshot,
    getServerSettingsPanelSnapshot,
  )
  useSharedStores(session, commander)
  const t = useTranslation()

  const showResults = useSyncExternalStore(
    subscribeToResultsPanel,
    getResultsPanelSnapshot,
    getServerResultsPanelSnapshot,
  )
  const isSettingsVisible = withSettings && showSettings
  const withResults = aside !== undefined
  const isResultsVisible = !withResults || showResults

  const resultsLabel = t(withResults ? 'app.column.results' : 'app.column.content')
  const skipTargets = [
    ...(isSettingsVisible ? [{ id: SETTINGS_COLUMN_ID, label: t('app.skipTo.settings') }] : []),
    ...(isResultsVisible
      ? [{ id: RESULTS_COLUMN_ID, label: t('app.skipTo.results', { section: resultsLabel }) }]
      : []),
    ...(aside === undefined ? [] : [{ id: ASIDE_COLUMN_ID, label: t('app.skipTo.basket') }]),
  ]

  const gridClassName = columnsGridClass({
    withSettings: isSettingsVisible,
    withResults: isResultsVisible,
    withAside: aside !== undefined,
  })

  return (
    <div className="relative flex min-h-dvh w-full flex-col gap-3 px-3 py-3">
      <AgentUpdateBanner commander={commander} />

      <nav
        aria-label={t('app.skipGroup')}
        className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-3 focus-within:left-3 focus-within:z-10 focus-within:flex focus-within:gap-1"
      >
        {skipTargets.map((target) => (
          <a
            key={target.id}
            href={`#${target.id}`}
            className={cn(HEADER_CONTROL_CLASS, HEADER_CONTROL_ACCENT)}
          >
            {target.label}
          </a>
        ))}
      </nav>

      <AppHeader
        activeNav={activeNav}
        session={session}
        settings={
          withSettings
            ? {
                isVisible: showSettings,
                onToggle: () => setSettingsPanelVisible(!showSettings),
                controlsId: SETTINGS_COLUMN_ID,
              }
            : undefined
        }
        results={
          withResults
            ? {
                isVisible: showResults,
                onToggle: () => setResultsPanelVisible(!showResults),
                controlsId: RESULTS_COLUMN_ID,
              }
            : undefined
        }
      />

      <CommanderHeading commander={commander} />
      {notice}

      <main
        id="main-content"
        className={cn('grid min-w-0 flex-1 items-start gap-3', gridClassName)}
      >
        {isSettingsVisible ? (
          <aside
            id={SETTINGS_COLUMN_ID}
            aria-label={t('app.column.settings')}
            tabIndex={-1}
            className="flex min-w-0 flex-col gap-4"
          >
            <CommanderPanel commander={commander} farmMode={farmMode} />
          </aside>
        ) : null}

        {isResultsVisible ? (
          <section
            id={RESULTS_COLUMN_ID}
            aria-label={resultsLabel}
            tabIndex={-1}
            className="flex min-w-0 flex-col gap-3"
          >
            {children}
          </section>
        ) : null}

        {aside === undefined ? null : (
          <aside
            id={ASIDE_COLUMN_ID}
            aria-label={t('app.column.basket')}
            tabIndex={-1}
            className="min-w-0"
          >
            {aside}
          </aside>
        )}
      </main>

      {session.user?.isTestUser === true ? <MockStatePanel /> : null}

      <footer className="flex flex-col gap-2 border-t border-warm-300 pt-3 text-xs text-warm-600 dark:border-warm-700 dark:text-warm-400">
        <p>
          <a className="underline hover:no-underline" href={withBasePath('/privacy/')}>
            {t('privacy.link')}
          </a>
        </p>

        <p>
          {t('footer.fanProject')} {t('footer.trademarks')}
        </p>
        <p>
          {t('footer.estimates')} {t('footer.dataSources')}{' '}
          <a
            className="underline hover:no-underline"
            href="https://www.edsm.net"
            target="_blank"
            rel="noreferrer"
          >
            EDSM
          </a>
          {', '}
          <a
            className="underline hover:no-underline"
            href="https://spansh.co.uk"
            target="_blank"
            rel="noreferrer"
          >
            Spansh
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
