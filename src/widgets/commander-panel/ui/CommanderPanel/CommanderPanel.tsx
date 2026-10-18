'use client'

import cn from 'classnames'
import Link from 'next/link'
import { federalRankName, imperialRankName } from '@/entities/commander-state'
import { activeRankSides, useJournalMissions, type NavyRankMission } from '@/entities/mission-store'
import type { NavyProgress, UseCommanderStateResult } from '@/entities/commander-state'
import type { FarmMode } from '@/features/farm-recommender'
import { presenceNote } from '@/widgets/commander-panel/lib/presenceNote'
import { progressNote } from '@/widgets/commander-panel/lib/progressNote'
import { formatDateTime } from '@/shared/lib/formatDateTime'
import { Button } from '@/shared/ui/Button'
import { LoadingArea } from '@/shared/ui/Skeleton'
import { estimateJumpRange } from '@/entities/commander-state'
import { useTranslation, type Language } from '@/shared/lib/i18n'

function formatTimestamp(iso: string, language: Language): string {
  const parsed = Date.parse(iso)
  return Number.isNaN(parsed) ? iso : formatDateTime(parsed, language)
}

export function CommanderPanel({
  commander,
  farmMode,
}: {
  commander: UseCommanderStateResult
  farmMode?: FarmMode
}) {
  const { status, data, progress, errorMessage, refresh } = commander
  const t = useTranslation()
  const takenRankSides = activeRankSides(useJournalMissions(commander.mockJournalMissions))
  const isLoadingFirstTime = status === 'loading' && data === null

  return (
    <LoadingArea isLoading={isLoadingFirstTime}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('commander.fromAgent')}</p>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="rounded-md border border-warm-300 bg-warm-100 p-3 text-sm text-warm-900 dark:border-warm-600 dark:bg-warm-900 dark:text-warm-100"
        >
          {status === 'guest' ? (
            <p>
              {t('commander.manualEntry')}{' '}
              <Link
                href="/account"
                className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400"
              >
                {t('commander.signInLink')}
              </Link>
              {t('commander.signInToSeeAgent')}
            </p>
          ) : isLoadingFirstTime ? (
            <LoadingSummary />
          ) : data !== null ? (
            <CommanderSummary
              data={data}
              progress={progress}
              takenRankSides={takenRankSides}
              farmMode={farmMode}
            />
          ) : (
            <p>{t('commander.noState')}</p>
          )}

          {errorMessage === null ? null : (
            <p className="mt-2 text-danger-700 dark:text-danger-400">{errorMessage}</p>
          )}
        </div>

        {status === 'guest' ? null : (
          <div className="flex gap-2">
            <Button type="button" onClick={refresh} disabled={status === 'loading'}>
              {status === 'loading' ? t('commander.refreshing') : t('commander.refresh')}
            </Button>
          </div>
        )}
      </div>
    </LoadingArea>
  )
}

function CommanderSummary({
  data,
  progress,
  takenRankSides,
  farmMode,
}: {
  data: NonNullable<UseCommanderStateResult['data']>
  progress: NavyProgress | null
  takenRankSides: ReadonlySet<Exclude<NavyRankMission, null>>
  farmMode?: FarmMode
}) {
  const { state, updatedAt } = data
  const t = useTranslation()
  const presenceValue = presenceNote(state.presence, t, updatedAt)

  const imperial = progress?.imperial ?? {
    percent: state.imperialProgress,
    at: state.imperialProgressAt,
  }
  const federal = progress?.federal ?? {
    percent: state.federalProgress,
    at: state.federalProgressAt,
  }

  const jumpRange = estimateJumpRange(state.loadout ?? null)

  const rows: Row[] = [
    { label: t('commander.row.name'), value: state.commanderName },
    { label: t('commander.row.system'), value: state.currentSystem.name },
    {
      label: t('commander.row.station'),
      value: state.currentStation ?? t('commander.row.notDocked'),
    },
    { label: t('commander.row.ship'), value: state.ship },
    {
      label: t('commander.row.jumpRange'),
      value: `${state.jumpRangeLy}\u00a0${t('unit.ly')}`,
      note: jumpRange === null ? undefined : t('commander.jumpRangeBest'),
    },
    ...(state.loadout?.cargoCapacityT === undefined
      ? []
      : [
          {
            label: t('commander.row.cargo'),
            value: `${state.loadout.cargoT ?? '—'}\u00a0/\u00a0${state.loadout.cargoCapacityT}\u00a0${t('unit.tons')}`,
            note: state.loadout.cargoT === undefined ? t('commander.cargoUnknown') : undefined,
          },
        ]),
    ...(jumpRange === null
      ? []
      : [
          {
            label: t('commander.row.jumpRangeNow'),
            value: `${jumpRange.currentLy.toFixed(2)}\u00a0${t('unit.ly')}`,
            note: !jumpRange.cargoKnown
              ? t('commander.jumpRangeNoCargo')
              : !jumpRange.fuelKnown
                ? t('commander.jumpRangeNoFuel')
                : t('commander.jumpRangeMass', { mass: Math.round(jumpRange.currentMassT) }),
          },
        ]),
    {
      label: 'Imperial Navy',
      accented: farmMode === 'empire',
      value: t('commander.rankValue', {
        name: imperialRankName(state.imperialRank, t),
        index: state.imperialRank,
      }),
      note: progressNote(imperial, state.imperialRank, takenRankSides.has('imperial'), t),
    },
    {
      label: 'Federal Navy',
      accented: farmMode === 'federal',
      value: t('commander.rankValue', {
        name: federalRankName(state.federalRank, t),
        index: state.federalRank,
      }),
      note: progressNote(federal, state.federalRank, takenRankSides.has('federal'), t),
    },
    ...(presenceValue === null
      ? []
      : [{ label: t('commander.row.session'), value: presenceValue }]),
    { label: t('commander.row.observedAt'), value: formatTimestamp(state.observedAt, t.language) },
    { label: t('commander.row.storedAt'), value: formatTimestamp(updatedAt, t.language) },
  ]

  return <RowList rows={rows} />
}

type Row = {
  label: string
  value: string
  note?: string
  accented?: boolean
}

const ROW_LABEL_KEYS = [
  'commander.row.name',
  'commander.row.system',
  'commander.row.station',
  'commander.row.ship',
  'commander.row.jumpRange',
  null,
  null,
  'commander.row.observedAt',
  'commander.row.storedAt',
] as const

const NAVY_LABELS = ['Imperial Navy', 'Federal Navy'] as const

function LoadingSummary() {
  const t = useTranslation()
  let navy = 0

  return (
    <>
      <RowList
        rows={ROW_LABEL_KEYS.map((key) => ({
          label: key === null ? NAVY_LABELS[navy++] : t(key),
          value: t('commander.loadingValue'),
          note: key === null ? t('commander.percentLater') : undefined,
        }))}
        aria-hidden="true"
      />
      <span className="sr-only">{t('commander.loading')}</span>
    </>
  )
}

function RowList({ rows, ...rest }: { rows: Row[] } & React.HTMLAttributes<HTMLDListElement>) {
  const t = useTranslation()

  return (
    <dl className="flex flex-col gap-1" {...rest}>
      {rows.map(({ label, value, note, accented }) => (
        <div
          key={label}
          className={cn(
            'flex flex-col',
            accented === true
              ? 'rounded-md border border-aubergine-700 p-1 dark:border-orange-400'
              : '',
          )}
        >
          <dt className="flex flex-wrap items-baseline gap-x-2 text-xs text-warm-600 dark:text-warm-400">
            {label}
            {accented === true ? (
              <span className="rounded-sm border border-aubergine-700 px-1 text-aubergine-900 dark:border-orange-400 dark:text-orange-200">
                {t('commander.farmingSide')}
              </span>
            ) : null}
          </dt>
          <dd className="break-words font-medium">{value}</dd>
          {note === undefined ? null : (
            <p className="text-xs text-warm-600 italic dark:text-warm-400">{note}</p>
          )}
        </div>
      ))}
    </dl>
  )
}
