'use client'

import { useSession } from '@/entities/session'
import { GuestLanding } from '@/views/home/ui/GuestLanding'
import { HomePage } from '@/views/home/ui/HomePage/HomePage'

export function HomeRoute() {
  const session = useSession()
  const signedIn =
    session.status === 'user' || (session.status === 'unknown' && session.cachedLogin !== null)

  return signedIn ? <HomePage /> : <GuestLanding />
}
