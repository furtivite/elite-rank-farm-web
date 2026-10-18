'use client'

import { useState, useSyncExternalStore } from 'react'
import cn from 'classnames'
import type { FarmMode, ScoredStation } from '@/features/farm-recommender'
import type { MissionAddResult, MissionTarget } from '@/entities/mission-store'
import type { FineNotice } from '@/entities/commander-state'
import {
  arrivalStarNote,
  getServerStarMarkSnapshot,
  getStarMarkSnapshot,
  subscribeToStarMarks,
  toggleStarMark,
  type ArrivalStar,
} from '@/entities/galaxy-data'
import type { StationRatingValue } from '@/entities/station-rating'
import { useIsAdmin } from '@/entities/session'
import { copyToClipboard } from '@/shared/lib/copyToClipboard'
import { Button } from '@/shared/ui/Button'
import {
  formatFineDate,
  missionBoardLabel,
  ratingNote,
  ACCENTED_ALLEGIANCE,
  ALLEGIANCE_LABEL_KEYS,
  ALLEGIANCE_OF,
  PAD_LABEL,
} from '@/widgets/farm-navigator/lib/stationLabels'
import { StarMarkToggle } from '@/shared/ui/StarMarkToggle'
import { useTranslation } from '@/shared/lib/i18n'

type StationRowProps = {
  systemName: string
  systemId: string
  scored: ScoredStation
  onSetRating: (
    stationId: string,
    value: StationRatingValue | undefined,
    systemId?: string,
    systemName?: string,
  ) => void
  onAddMission: (target: MissionTarget) => MissionAddResult
  farmMode: FarmMode
  fine?: FineNotice | null
}

export function StationRow({
  systemName,
  systemId,
  scored,
  onSetRating,
  onAddMission,
  farmMode,
  fine = null,
}: StationRowProps) {
  const t = useTranslation()
  const { station, factions, rating, missionCount, score, reasons } = scored
  const [showActions, setShowActions] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const ratingButton = (value: StationRatingValue, label: string) => {
    const isActive = rating === value
    return (
      <Button
        type="button"
        variant={isActive ? 'primary' : 'secondary'}
        aria-pressed={isActive}
        onClick={() =>
          onSetRating(station.id, isActive ? undefined : value, station.systemId, systemName)
        }
        className="min-h-8 px-2 text-xs"
      >
        {label}
      </Button>
    )
  }

  const isAdmin = useIsAdmin()
  const marks = useSyncExternalStore(
    subscribeToStarMarks,
    getStarMarkSnapshot,
    getServerStarMarkSnapshot,
  )
  const override = marks.get(station.id)
  const star: ArrivalStar | undefined =
    override === true
      ? { isMain: false, source: 'manual' }
      : override === false
        ? station.star?.source === 'manual'
          ? undefined
          : station.star
        : station.star
  const starNote = arrivalStarNote(star, t)
  const dumpSaysOther = station.star?.isMain === false && station.star.source === 'dump'

  const accented = ACCENTED_ALLEGIANCE[farmMode]
  const factionParts = (
    [
      { key: 'imperial', label: `Imp ×${factions.imperial}`, count: factions.imperial },
      { key: 'federal', label: `Fed ×${factions.federal}`, count: factions.federal },
      { key: 'alliance', label: `Ali ×${factions.alliance}`, count: factions.alliance },
      { key: 'independent', label: `Ind ×${factions.independent}`, count: factions.independent },
      { key: 'other', label: `Other ×${factions.other}`, count: factions.other },
    ] as const
  ).filter((part) => part.count > 0)

  return (
    <div className="border-t border-warm-200 text-xs dark:border-warm-800">
      <button
        type="button"
        onClick={() => setShowActions((prev) => !prev)}
        aria-expanded={showActions}
        className="block w-full px-2 py-1.5 text-left transition-colors hover:bg-warm-100 active:bg-warm-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:hover:bg-warm-800 dark:active:bg-warm-700 dark:focus-visible:outline-orange-400"
      >
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-medium">{station.name}</span>

          {starNote === null ? null : (
            <span className="rounded-sm bg-caution-600 px-1 font-medium text-white dark:bg-caution-500 dark:text-warm-950">
              {starNote}
            </span>
          )}

          <span className="text-warm-600 dark:text-warm-400">
            {station.type ?? t('station.unknownType')}
            {station.distanceToArrivalLs !== undefined
              ? ` · ${Math.round(station.distanceToArrivalLs)}\u00a0${t('unit.ls')}`
              : t('station.unknownDistance')}
            {station.maxPadSize ? ` · ${PAD_LABEL[station.maxPadSize]}` : t('station.unknownPad')}
            {` · ${missionBoardLabel(station.hasMissionBoard, station.missionBoardSource, t)}`}
            {ratingNote(rating, t)}
          </span>

          {rating === 'blocked' ? (
            <span className="rounded-sm border border-warm-500 px-1 font-medium text-warm-700 dark:border-warm-400 dark:text-warm-300">
              {t('station.blockedNote')}
            </span>
          ) : null}

          {missionCount > 0 ? (
            <span className="rounded bg-warm-200 px-1.5 font-medium dark:bg-warm-700">
              {t('results.missionCount', { count: missionCount })}
            </span>
          ) : null}

          <span className="ml-auto font-semibold">{score}</span>
        </span>

        <span className="block text-warm-600 dark:text-warm-400">
          {reasons.length === 0
            ? t('station.scoreWithoutParts')
            : reasons
                .map((reason) => `${reason.delta >= 0 ? '+' : ''}${reason.delta} ${reason.label}`)
                .join('  ')}
        </span>

        {station.controllingFaction === undefined ? null : (
          <span className="block text-warm-600 dark:text-warm-400">
            {t('station.controllingFaction', { faction: station.controllingFaction.name })}
            {fine === null || fine === undefined ? null : (
              <span className="ml-1 rounded-sm bg-danger-600 px-1 text-white dark:bg-danger-400 dark:text-warm-950">
                {t('station.fineSince', { when: formatFineDate(fine.observedAt, t.language) })}
              </span>
            )}
            {station.controllingFaction.allegiance === ALLEGIANCE_OF[farmMode] ? (
              <span className="font-semibold">{t('station.yourSide')}</span>
            ) : (
              <span> · {t(ALLEGIANCE_LABEL_KEYS[station.controllingFaction.allegiance])}</span>
            )}
          </span>
        )}

        {factionParts.length === 0 ? null : (
          <span className="block text-warm-500 dark:text-warm-400">
            {t('station.systemFactions')}{' '}
            {factionParts.map((part, index) => (
              <span key={part.key}>
                {index === 0 ? null : ' · '}
                <span
                  className={cn(
                    part.key === accented && 'font-semibold text-warm-800 dark:text-warm-200',
                  )}
                >
                  {part.label}
                </span>
                {part.key === accented ? (
                  <span className="sr-only">{t('station.yourSideSr')}</span>
                ) : null}
              </span>
            ))}
          </span>
        )}
      </button>

      {showActions ? (
        <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setLimitReached(
                onAddMission({
                  targetSystem: systemName,
                  targetSystemId: systemId,
                  targetBody: station.bodyName,
                  targetStation: station.name,
                  targetStationId: station.id,
                }) === 'limit-reached',
              )
            }
            className="min-h-8 px-2 text-xs"
          >
            +1 mission
          </Button>
          {limitReached ? (
            <span role="status" className="self-center text-caution-800 dark:text-caution-300">
              {t('station.missionLimitReached')}
            </span>
          ) : null}
          {ratingButton('good', 'Good')}
          {ratingButton('bad', 'Bad')}
          {ratingButton('blocked', 'Block')}
          <Button
            type="button"
            variant="secondary"
            onClick={() => copyToClipboard(systemName)}
            className="min-h-8 px-2 text-xs"
          >
            Copy system
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => copyToClipboard(station.name)}
            className="min-h-8 px-2 text-xs"
          >
            Copy station
          </Button>
          {station.bodyName === undefined || station.bodyName.trim() === '' ? null : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => copyToClipboard(station.bodyName ?? '')}
              className="min-h-8 px-2 text-xs"
            >
              Copy body
            </Button>
          )}
          {isAdmin && !dumpSaysOther ? (
            <StarMarkToggle
              stationName={station.name}
              isMarked={star?.source === 'manual'}
              onChange={(next) => {
                void toggleStarMark(station.id, next)
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
