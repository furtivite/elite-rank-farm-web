import {
  closeTimeMinutes,
  estimateSystemCloseTime,
  type MissionSystemGroup,
  type StationFactsByStationId,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'

export function SystemCloseTime({
  system,
  stationFacts,
}: {
  system: MissionSystemGroup
  stationFacts: StationFactsByStationId
}) {
  const t = useTranslation()
  const estimate = estimateSystemCloseTime(system, stationFacts)

  if (estimate.stations === 0 || estimate.unknownStations === estimate.stations) {
    return null
  }

  const minutes = closeTimeMinutes(estimate)
  const full = t('basket.closeTime', {
    missions: t.plural('plural.missions', estimate.missions),
    stations: t.plural('plural.stations', estimate.stations),
    minutes,
  })

  return (
    <span className="text-warm-600 dark:text-warm-400" title={t('basket.closeTimeExplain')}>
      <span aria-hidden="true">{t('basket.closeTimeShort', { minutes })}</span>
      <span className="sr-only">
        {full} — {t('basket.closeTimeExplain')}
      </span>
    </span>
  )
}
