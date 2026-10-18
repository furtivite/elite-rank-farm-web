'use client'

import { useState } from 'react'
import type { BodyGroup, FarmMode, ScoredStation } from '@/features/farm-recommender'
import type { MissionAddResult, MissionTarget } from '@/entities/mission-store'
import type { FineNotice } from '@/entities/commander-state'
import type { StationRatingValue } from '@/entities/station-rating'
import { StationRow } from '@/widgets/farm-navigator/ui/StationRow/StationRow'
import { useTranslation } from '@/shared/lib/i18n'

type BodyRowProps = {
  systemName: string
  systemId: string
  group: BodyGroup
  onSetRating: (
    stationId: string,
    value: StationRatingValue | undefined,
    systemId?: string,
    systemName?: string,
  ) => void
  onAddMission: (target: MissionTarget) => MissionAddResult
  farmMode: FarmMode
  fineFor?: (station: ScoredStation) => FineNotice | null
}

export function BodyRow({
  systemName,
  systemId,
  group,
  onSetRating,
  onAddMission,
  farmMode,
  fineFor = () => null,
}: BodyRowProps) {
  const t = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-t border-warm-200 dark:border-warm-800">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-baseline gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-warm-100 active:bg-warm-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:hover:bg-warm-800 dark:active:bg-warm-700 dark:focus-visible:outline-orange-400"
      >
        <span aria-hidden="true" className="w-3 text-warm-500 dark:text-warm-400">
          {isOpen ? '▾' : '▸'}
        </span>
        <span className="font-medium">{group.bodyName ?? t('results.aroundStar')}</span>
        <span className="text-warm-600 dark:text-warm-400">
          {t('results.stationsShort', { count: group.stations.length })}
        </span>
        {group.missionCount > 0 ? (
          <span className="rounded bg-warm-200 px-1.5 font-medium dark:bg-warm-700">
            {t('results.missionCount', { count: group.missionCount })}
          </span>
        ) : null}
        <span className="ml-auto text-warm-600 dark:text-warm-400">
          {t('results.bestScore', { score: group.bestScore })}
        </span>
      </button>

      {isOpen ? (
        <div className="pl-5">
          {group.stations.map((scored) => (
            <StationRow
              key={scored.station.id}
              systemName={systemName}
              systemId={systemId}
              scored={scored}
              onSetRating={onSetRating}
              onAddMission={onAddMission}
              farmMode={farmMode}
              fine={fineFor(scored)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
