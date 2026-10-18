'use client'

import {
  formatVisitOrder,
  visitOrder,
  type MissionSystemGroup,
  type StationFactsByStationId,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'

export function VisitOrderHint({
  system,
  stationFacts,
}: {
  system: MissionSystemGroup
  stationFacts: StationFactsByStationId
}) {
  const t = useTranslation()
  const text = formatVisitOrder(visitOrder(system, stationFacts), t)
  if (text === null) {
    return null
  }

  return <p className="text-warm-700 dark:text-warm-300">{text}</p>
}
