'use client'

import { useCommanderState } from '@/entities/commander-state'
import { useSession } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { STORAGE_NOTES } from '@/shared/config/storageKeys'
import { AppShell } from '@/widgets/app-shell'

const CONTACT_EMAIL = 'elite@frtvt.com'

export function PrivacyPage() {
  const t = useTranslation()
  const session = useSession()
  const commander = useCommanderState(
    session.status === 'user',
    session.user?.isTestUser === true,
    session.status === 'guest',
  )

  const storedInBrowser = STORAGE_NOTES.map((note) => t(note.what)).join(', ')

  return (
    <AppShell activeNav="privacy" commander={commander} session={session} withSettings={false}>
      <section aria-labelledby="privacy-heading" className="flex max-w-2xl flex-col gap-4">
        <h2 id="privacy-heading" className="text-xl font-semibold">
          {t('privacy.title')}
        </h2>

        <p className="text-sm text-warm-800 dark:text-warm-200">
          {t('privacy.intro', { email: CONTACT_EMAIL })}
        </p>

        <section aria-labelledby="privacy-browser" className="flex flex-col gap-2">
          <h3 id="privacy-browser" className="text-base font-semibold">
            {t('privacy.browserHeading')}
          </h3>
          <p className="text-sm text-warm-800 dark:text-warm-200">
            {t('privacy.cookie', { cookie: 'elite_session' })}{' '}
            {t('privacy.cookieLifetime', { remember: t('signIn.remember') })}
          </p>
          <p className="text-sm text-warm-800 dark:text-warm-200">
            {t('privacy.localStorage', { list: storedInBrowser })}
          </p>
        </section>

        <section aria-labelledby="privacy-server" className="flex flex-col gap-2">
          <h3 id="privacy-server" className="text-base font-semibold">
            {t('privacy.serverHeading')}
          </h3>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('privacy.serverWhat')}</p>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('privacy.serverWhy')}</p>
        </section>

        <section aria-labelledby="privacy-emails" className="flex flex-col gap-2">
          <h3 id="privacy-emails" className="text-base font-semibold">
            {t('privacy.emailsHeading')}
          </h3>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('privacy.emails')}</p>
        </section>

        <section aria-labelledby="privacy-captcha" className="flex flex-col gap-2">
          <h3 id="privacy-captcha" className="text-base font-semibold">
            {t('privacy.captchaHeading')}
          </h3>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('privacy.captcha')}</p>
          <p className="text-sm text-warm-800 dark:text-warm-200">
            {t('privacy.captchaTerms')}{' '}
            <a
              className="underline hover:no-underline"
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              policies.google.com/privacy
            </a>
          </p>
        </section>

        <section aria-labelledby="privacy-delete" className="flex flex-col gap-2">
          <h3 id="privacy-delete" className="text-base font-semibold">
            {t('privacy.deleteHeading')}
          </h3>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('privacy.deleteBrowser')}</p>
          <p className="text-sm text-warm-800 dark:text-warm-200">
            {t('privacy.deleteAccount', { email: CONTACT_EMAIL })}
          </p>
        </section>

        <section aria-labelledby="privacy-legal" className="flex flex-col gap-2">
          <h3 id="privacy-legal" className="text-base font-semibold">
            {t('footer.fanProject')}
          </h3>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('footer.trademarks')}</p>
          <p className="text-sm text-warm-800 dark:text-warm-200">{t('privacy.estimates')}</p>
        </section>
      </section>
    </AppShell>
  )
}
