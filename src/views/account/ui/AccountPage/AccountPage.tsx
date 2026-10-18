'use client'

import { useState } from 'react'
import { useCommanderState } from '@/entities/commander-state'
import { useSession } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { LoadingArea, SkeletonLines } from '@/shared/ui/Skeleton'
import { AppShell } from '@/widgets/app-shell'
import { EmailConfirmForm } from '@/views/account/ui/EmailConfirmForm'
import { RegisterForm } from '@/views/account/ui/RegisterForm'
import { SignInForm } from '@/views/account/ui/SignInForm/SignInForm'
import { SignedIn } from '@/views/account/ui/SignedIn/SignedIn'

type GuestScreen =
  | { kind: 'signIn' }
  | { kind: 'register' }
  | { kind: 'confirm'; login: string; password: string; remember: boolean }

export function AccountPage() {
  const t = useTranslation()
  const session = useSession()
  const commander = useCommanderState(
    session.status === 'user',
    session.user?.isTestUser === true,
    session.status === 'guest',
  )
  const [screen, setScreen] = useState<GuestScreen>({ kind: 'signIn' })

  const guestScreen = () => {
    if (screen.kind === 'register') {
      return (
        <RegisterForm
          onRegistered={(login, password) =>
            setScreen({ kind: 'confirm', login, password, remember: false })
          }
          onCancel={() => setScreen({ kind: 'signIn' })}
        />
      )
    }

    if (screen.kind === 'confirm') {
      return (
        <EmailConfirmForm
          initialLogin={screen.login}
          initialPassword={screen.password}
          remember={screen.remember}
          onCancel={() => setScreen({ kind: 'signIn' })}
        />
      )
    }

    return (
      <SignInForm
        session={session}
        onRegister={() => setScreen({ kind: 'register' })}
        onNeedConfirm={(login, password, remember) =>
          setScreen({ kind: 'confirm', login, password, remember })
        }
      />
    )
  }

  return (
    <AppShell activeNav="account" commander={commander} session={session} withSettings={false}>
      <h2 className="text-xl font-semibold">{t('account.title')}</h2>

      {session.status === 'unknown' ? (
        <LoadingArea isLoading className="flex max-w-sm flex-col gap-3">
          <SkeletonLines count={5} label={t('account.checkingSession')} />
        </LoadingArea>
      ) : session.status === 'guest' ? (
        guestScreen()
      ) : (
        <SignedIn session={session} commander={commander} />
      )}
    </AppShell>
  )
}
