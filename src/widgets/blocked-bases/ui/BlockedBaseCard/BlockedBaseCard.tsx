'use client'

import { useState } from 'react'
import { toggleStarMark } from '@/entities/galaxy-data'
import { useIsAdmin } from '@/entities/session'
import type { BlockedBase } from '@/features/blocked-bases'
import { copyToClipboard } from '@/shared/lib/copyToClipboard'
import { formatDateTime } from '@/shared/lib/formatDateTime'
import { Button } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'

const PAD_LABEL: Record<'S' | 'M' | 'L', string> = {
  S: 'Small pad',
  M: 'Medium pad',
  L: 'Large pad',
}

type BlockedBaseCardProps = {
  base: BlockedBase
  onUnblock: (stationId: string) => void
  onSetRating: (stationId: string, value: 'good' | 'bad') => void
  onSaveNote: (stationId: string, note: string) => void
}

export function BlockedBaseCard({
  base,
  onUnblock,
  onSetRating,
  onSaveNote,
}: BlockedBaseCardProps) {
  const t = useTranslation()
  const isAdmin = useIsAdmin()
  const { station, systemName, systemFactionSummary, systemFactions, blockedAt, note } = base
  const [noteDraft, setNoteDraft] = useState(note ?? '')

  return (
    <div className="flex flex-col gap-2 rounded-md border border-warm-300 bg-white p-3 text-sm text-warm-900 dark:border-warm-600 dark:bg-warm-950 dark:text-warm-100">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-base font-semibold">{station.name}</p>
          <p className="text-warm-700 dark:text-warm-300">
            {systemName}
            {station.bodyName ? ` · ${station.bodyName}` : ''}
          </p>
        </div>
        {blockedAt ? (
          <p className="text-xs text-warm-500 dark:text-warm-400">
            {t('blocked.blockedAt', {
              when: formatDateTime(new Date(blockedAt).getTime(), t.language),
            })}
          </p>
        ) : null}
      </div>

      <p className="text-warm-700 dark:text-warm-300">
        {station.type ?? t('station.unknownType')}
        {station.distanceToArrivalLs !== undefined
          ? ` · ${Math.round(station.distanceToArrivalLs)} ls`
          : t('station.unknownDistance')}
        {station.maxPadSize ? ` · ${PAD_LABEL[station.maxPadSize]}` : t('station.unknownPad')}
        {station.controllingFaction
          ? ` · ${station.controllingFaction.name} (${station.controllingFaction.allegiance})`
          : ''}
      </p>

      <p className="text-warm-700 dark:text-warm-300">
        {t('blocked.systemFactions')}{' '}
        {systemFactionSummary.imperial > 0 ? `Imperial ×${systemFactionSummary.imperial} ` : ''}
        {systemFactionSummary.federal > 0 ? `Federal ×${systemFactionSummary.federal} ` : ''}
        {systemFactionSummary.alliance > 0 ? `Alliance ×${systemFactionSummary.alliance} ` : ''}
        {systemFactionSummary.independent > 0
          ? `Independent ×${systemFactionSummary.independent} `
          : ''}
        {systemFactionSummary.other > 0 ? `Other ×${systemFactionSummary.other}` : ''}
      </p>

      <details className="text-warm-700 dark:text-warm-300">
        <summary className="cursor-pointer select-none">{t('blocked.allSystemFactions')}</summary>
        <ul className="mt-1 flex flex-col gap-0.5">
          {systemFactions.map((faction) => (
            <li key={faction.name}>
              {faction.name} — {faction.allegiance}
            </li>
          ))}
        </ul>
      </details>

      <label className="flex flex-col gap-1">
        <span className="text-warm-700 dark:text-warm-300">{t('blocked.note')}</span>
        <textarea
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          onBlur={() => {
            if (noteDraft !== (note ?? '')) {
              onSaveNote(station.id, noteDraft)
            }
          }}
          rows={2}
          className="w-full rounded-md border border-warm-500 bg-white px-3 py-2 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={() => onUnblock(station.id)}
          className="px-3 text-sm"
        >
          Unblock
        </Button>
        {isAdmin ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void toggleStarMark(station.id, true)
            }}
            className="px-3 text-sm"
          >
            {t('blocked.markOtherStar')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSetRating(station.id, 'good')}
          className="px-3 text-sm"
        >
          👍 Good
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSetRating(station.id, 'bad')}
          className="px-3 text-sm"
        >
          👎 Bad
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => copyToClipboard(systemName)}
          className="px-3 text-sm"
        >
          Copy system
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => copyToClipboard(station.name)}
          className="px-3 text-sm"
        >
          Copy station
        </Button>
      </div>
    </div>
  )
}
