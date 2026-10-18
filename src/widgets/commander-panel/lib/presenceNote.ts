import { PRESENCE_STALE_AFTER_MS, type CommanderPresence } from '@/entities/commander-state'
import type { Translate } from '@/shared/lib/i18n'
import { formatDateTime } from '@/shared/lib/formatDateTime'

export function presenceNote(
  presence: CommanderPresence | undefined,
  t: Translate,
  storedAt?: string,
  now: number = Date.now(),
): string | null {
  if (presence === undefined) {
    return null
  }

  const at = Date.parse(presence.at)
  const when = Number.isNaN(at) ? presence.at : formatDateTime(at, t.language)

  const stored = storedAt === undefined ? Number.NaN : Date.parse(storedAt)
  if (!Number.isNaN(stored) && now - stored >= PRESENCE_STALE_AFTER_MS) {
    return t('presence.silent', {
      when: formatDateTime(stored, t.language),
    })
  }

  if (presence.status === 'playing') {
    return t('presence.playing', { when })
  }
  if (presence.status === 'gameExited') {
    return t('presence.gameExited', { when })
  }

  return t('presence.agentStopped', { when })
}
