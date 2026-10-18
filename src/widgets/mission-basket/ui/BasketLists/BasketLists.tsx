'use client'

import {
  type JournalMission,
  type MissionSystemGroup,
  rankSidesByStation,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'
import { BasketSystemList } from '@/widgets/mission-basket/ui/BasketSystemList'
import type { ComponentProps } from 'react'

type ListProps = Omit<
  ComponentProps<typeof BasketSystemList>,
  'groups' | 'rankSides' | 'marksDuplicates' | 'fromJournal'
>

type BasketListsProps = {
  groups: readonly MissionSystemGroup[]
  manualGroups: readonly MissionSystemGroup[]
  rankStations: ReturnType<typeof rankSidesByStation>
  unknownJournal: readonly JournalMission[]
  listProps: ListProps
}

export function BasketLists({
  groups,
  manualGroups,
  rankStations,
  unknownJournal,
  listProps,
}: BasketListsProps) {
  const t = useTranslation()

  return (
    <>
      {groups.length === 0 ? (
        <p className="text-xs text-warm-600 dark:text-warm-400">{t('basket.empty')}</p>
      ) : (
        <BasketSystemList
          groups={groups}
          rankSides={rankStations}
          marksDuplicates={false}
          fromJournal
          {...listProps}
        />
      )}

      {unknownJournal.length === 0 ? null : (
        <p className="text-xs text-warm-600 dark:text-warm-400">
          {t('basket.unknownJournal', {
            missions: t.plural('plural.missions', unknownJournal.length),
          })}
        </p>
      )}

      {manualGroups.length === 0 ? null : (
        <div className="flex flex-col gap-2 rounded-md border border-warm-400 p-2 dark:border-warm-600">
          <p className="text-xs font-medium text-warm-700 dark:text-warm-300">
            {t('basket.addedByHand')}
          </p>
          <BasketSystemList
            groups={manualGroups}
            rankSides={null}
            marksDuplicates
            fromJournal={false}
            {...listProps}
          />
        </div>
      )}
    </>
  )
}
