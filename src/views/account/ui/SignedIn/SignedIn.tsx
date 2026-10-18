'use client'

import { type UseCommanderStateResult } from '@/entities/commander-state'
import type { UseSessionResult } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { CommanderPanel } from '@/widgets/commander-panel'
import { GalaxyRegionStatus } from '@/widgets/galaxy-region-status'
import { AgentSection } from '@/views/account/ui/AgentSection/AgentSection'
import { MissionSettingsSection } from '@/views/account/ui/MissionSettingsSection/MissionSettingsSection'
import { JumpMultiplierSection } from '@/views/account/ui/JumpMultiplierSection'
import { ResultsOrderSection } from '@/views/account/ui/ResultsOrderSection'
import { ResultsPageSizeSection } from '@/views/account/ui/ResultsPageSizeSection'
import { DistanceModeSection } from '@/views/account/ui/DistanceModeSection'
import { OtherSessionsSection } from '@/views/account/ui/OtherSessionsSection/OtherSessionsSection'
import { TestSessionsSection } from '@/views/account/ui/TestSessionsSection'
import { PasswordSection } from '@/views/account/ui/PasswordSection/PasswordSection'

export function SignedIn({
  session,
  commander,
}: {
  session: UseSessionResult
  commander: UseCommanderStateResult
}) {
  const t = useTranslation()
  const isTestUser = session.user?.isTestUser === true

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="commander-section-heading" className="flex flex-col gap-2">
          <h3 id="commander-section-heading" className="text-base font-semibold">
            {t('account.commanderHeading')}
          </h3>
          <CommanderPanel commander={commander} />
        </section>

        <section aria-labelledby="dataset-section-heading" className="flex flex-col gap-4">
          <h3 id="dataset-section-heading" className="text-base font-semibold">
            {t('account.galaxyData')}
          </h3>
          <GalaxyRegionStatus activeRegion="galaxy" />
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section aria-labelledby="account-heading" className="flex flex-col gap-2">
          <h3 id="account-heading" className="text-base font-semibold">
            {t('account.heading')}
          </h3>
          <dl className="text-sm">
            <div className="flex gap-2">
              <dt className="text-warm-600 dark:text-warm-400">{t('account.loginLabel')}</dt>
              <dd className="font-medium">{session.user?.login}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-warm-600 dark:text-warm-400">{t('account.emailLabel')}</dt>
              <dd className="break-all">{session.user?.email}</dd>
            </div>
          </dl>

          {isTestUser ? (
            <p
              role="note"
              className="rounded-md border border-caution-600 bg-caution-50 p-2 text-sm text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100"
            >
              {t('account.testUserNote')}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void session.signOut()}
            disabled={session.isBusy}
            className="self-start"
          >
            {t('account.signOut')}
          </Button>
          {session.errorMessage === null ? null : (
            <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
              {session.errorMessage}
            </p>
          )}
        </section>

        {isTestUser ? null : (
          <PasswordSection passwordResetEnabled={session.passwordResetEnabled} />
        )}
        {isTestUser ? null : <OtherSessionsSection />}

        {session.user?.isAdmin === true ? <TestSessionsSection /> : null}

        <MissionSettingsSection />

        <div className="grid items-start gap-6 sm:grid-cols-3">
          <ResultsOrderSection />
          <JumpMultiplierSection jumpRangeLy={commander.data?.state.jumpRangeLy ?? null} />
          <ResultsPageSizeSection />
        </div>

        <DistanceModeSection />

        <AgentSection isTestUser={isTestUser} />
      </div>
    </div>
  )
}
