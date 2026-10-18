'use client'

import cn from 'classnames'
import { useId, useState } from 'react'
import {
  CLUSTER_NAME_MAX_LENGTH,
  type FarmClusterDraft,
  type SavedFarmCluster,
} from '@/entities/farm-cluster'
import type {
  ClusterCandidate,
  ClusterSearchMode,
  UseClusterDiscoveryResult,
} from '@/features/farm-recommender'
import { DISCOVERY_RADIUS_LY } from '@/features/farm-recommender'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Select'
import { useTranslation, type TranslationKey } from '@/shared/lib/i18n'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-2 text-sm text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

const labelClassName = 'min-h-4 text-xs font-medium text-warm-700 dark:text-warm-300'

const hintClassName = 'text-xs text-warm-600 dark:text-warm-400'

const MODE_LABEL_KEYS: Record<ClusterSearchMode, TranslationKey | null> = {
  auto: null,
  stay: 'clusters.mode.stay',
  better: 'clusters.mode.better',
}

const MODE_HINT_KEYS: Record<ClusterSearchMode, TranslationKey> = {
  auto: 'clusters.hint.auto',
  stay: 'clusters.hint.stay',
  better: 'clusters.hint.better',
}

const MODES: readonly ClusterSearchMode[] = ['auto', 'stay', 'better']

export type FarmClusterPanelProps = {
  clusterMode: ClusterSearchMode
  onClusterModeChange: (mode: ClusterSearchMode) => void
  clusters: readonly SavedFarmCluster[]
  selectedClusterId: string | null
  onSelectCluster: (id: string | null) => void
  draft: FarmClusterDraft | null
  onSave: (draft: FarmClusterDraft) => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
  discovery: UseClusterDiscoveryResult
  onDiscover: () => void
  onSaveCandidate: (candidate: ClusterCandidate) => void
}

export function FarmClusterPanel({
  clusterMode,
  onClusterModeChange,
  clusters,
  selectedClusterId,
  onSelectCluster,
  draft,
  onSave,
  onRename,
  onRemove,
  discovery,
  onDiscover,
  onSaveCandidate,
}: FarmClusterPanelProps) {
  const t = useTranslation()
  const modeLabel = (mode: ClusterSearchMode) => {
    const key = MODE_LABEL_KEYS[mode]
    return key === null ? 'Auto discovery' : t(key)
  }

  const modeGroupName = useId()
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [rename, setRename] = useState<{ clusterId: string; value: string } | null>(null)

  const selected = clusters.find((cluster) => cluster.id === selectedClusterId) ?? null
  const renameValue = rename !== null && rename.clusterId === selected?.id ? rename.value : null

  return (
    <section aria-labelledby="farm-clusters-heading" className="flex min-w-0 flex-col gap-2">
      <h2 id="farm-clusters-heading" className="text-sm font-semibold">
        {t('clusters.heading')}
      </h2>

      <fieldset className="flex flex-col rounded-md border border-warm-300 px-2 pb-2 dark:border-warm-600">
        <legend className="mb-1.5 px-1 text-sm font-semibold">{t('clusters.modeGroup')}</legend>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {MODES.map((value) => (
            <label
              key={value}
              className={cn(
                'flex min-h-11 min-w-0 flex-1 basis-32 cursor-pointer items-center gap-2 rounded-md border px-2 text-sm font-medium',
                clusterMode === value
                  ? 'border-aubergine-700 text-warm-900 dark:border-orange-500 dark:text-warm-100'
                  : 'border-warm-300 text-warm-700 dark:border-warm-600 dark:text-warm-300',
              )}
            >
              <input
                type="radio"
                name={modeGroupName}
                value={value}
                checked={clusterMode === value}
                onChange={() => onClusterModeChange(value)}
                className="size-4 accent-aubergine-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:accent-orange-500 dark:focus-visible:outline-orange-400"
              />
              {modeLabel(value)}
            </label>
          ))}
        </div>
      </fieldset>

      <p className={hintClassName}>{t(MODE_HINT_KEYS[clusterMode])}</p>

      {clusters.length === 0 ? (
        <p className={hintClassName}>{t('clusters.noneInRegion')}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="farm-cluster-select" className={labelClassName}>
            {t('clusters.label')}
          </label>
          <Select
            id="farm-cluster-select"
            value={selectedClusterId ?? ''}
            className={inputClassName}
            onChange={(event) => {
              onSelectCluster(event.target.value === '' ? null : event.target.value)
              setRename(null)
            }}
          >
            <option value="">{t('clusters.notChosen')}</option>
            {clusters.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </option>
            ))}
          </Select>
          {selected === null ? null : (
            <p className={hintClassName}>
              {t('clusters.centerAndRadius', {
                system: selected.centerSystem,
                radius: Math.round(selected.radiusLy),
              })}
            </p>
          )}
        </div>
      )}

      {clusterMode === 'stay' && selected === null ? (
        <p className={hintClassName}>{t('clusters.pickOne')}</p>
      ) : null}

      {selected === null ? null : (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="secondary"
            className="text-sm"
            onClick={() =>
              setRename(
                renameValue === null ? { clusterId: selected.id, value: selected.name } : null,
              )
            }
            aria-expanded={renameValue !== null}
          >
            {t('clusters.rename')}
          </Button>
          <Button
            variant="danger"
            className="text-sm"
            onClick={() => {
              onRemove(selected.id)
              onSelectCluster(null)
              setRename(null)
            }}
          >
            {t('clusters.delete')}
          </Button>
        </div>
      )}

      {selected !== null && renameValue !== null ? (
        <form
          className="flex flex-col gap-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            onRename(selected.id, renameValue)
            setRename(null)
          }}
        >
          <label htmlFor="farm-cluster-rename" className={labelClassName}>
            {t('clusters.newName')}
          </label>
          <input
            id="farm-cluster-rename"
            type="text"
            autoComplete="off"
            maxLength={CLUSTER_NAME_MAX_LENGTH}
            value={renameValue}
            onChange={(event) => setRename({ clusterId: selected.id, value: event.target.value })}
            className={inputClassName}
          />
          <div className="flex flex-wrap gap-1.5">
            <Button type="submit" className="text-sm" disabled={renameValue.trim() === ''}>
              {t('clusters.saveName')}
            </Button>
            <Button variant="secondary" className="text-sm" onClick={() => setRename(null)}>
              {t('clusters.cancel')}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col gap-1.5 border-t border-warm-300 pt-2 dark:border-warm-700">
        <Button
          variant="secondary"
          className="text-sm"
          onClick={onDiscover}
          disabled={discovery.status === 'loading'}
          aria-busy={discovery.status === 'loading'}
        >
          {discovery.status === 'loading' ? t('clusters.scanning') : t('clusters.suggest')}
        </Button>
        <p className={hintClassName}>
          {t('clusters.suggestHint', { radius: DISCOVERY_RADIUS_LY })}
        </p>

        {discovery.status === 'error' ? (
          <p className="text-xs text-danger-700 dark:text-danger-400">
            {discovery.errorMessage ?? t('clusters.scanFailed')}
          </p>
        ) : discovery.status === 'empty' ? (
          <p className={hintClassName}>{t('clusters.scanEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {discovery.candidates.map((candidate) => (
              <li
                key={candidate.centerSystem}
                className="flex flex-wrap items-center justify-between gap-1.5 rounded-md border border-warm-300 p-1.5 dark:border-warm-700"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{candidate.centerSystem}</p>
                  <p className={hintClassName}>
                    {t('clusters.candidateCounts', {
                      stations: candidate.stations,
                      nearStar: candidate.stationsNearStar,
                      systems: candidate.systems,
                    })}
                    {candidate.medianArrivalLs === null
                      ? ''
                      : t('clusters.candidateMedian', { median: candidate.medianArrivalLs })}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => onSaveCandidate(candidate)}
                >
                  {t('clusters.save')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {draft === null ? (
        <p className={hintClassName}>{t('clusters.saveAfterSearch')}</p>
      ) : isSaveOpen ? (
        <form
          className="flex flex-col gap-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            const name = saveName.trim()
            if (name === '') {
              return
            }

            onSave({ ...draft, name })
            setIsSaveOpen(false)
            setSaveName('')
          }}
        >
          <label htmlFor="farm-cluster-name" className={labelClassName}>
            {t('clusters.name')}
          </label>
          <input
            id="farm-cluster-name"
            type="text"
            autoComplete="off"
            maxLength={CLUSTER_NAME_MAX_LENGTH}
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
            className={inputClassName}
          />
          <p className={hintClassName}>
            {t('clusters.centerAndRadius', {
              system: draft.centerSystem,
              radius: Math.round(draft.radiusLy),
            })}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button type="submit" className="text-sm" disabled={saveName.trim() === ''}>
              {t('clusters.saveCluster')}
            </Button>
            <Button
              variant="secondary"
              className="text-sm"
              onClick={() => {
                setIsSaveOpen(false)
                setSaveName('')
              }}
            >
              {t('clusters.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="secondary"
          className="text-sm"
          onClick={() => {
            setIsSaveOpen(true)
            setSaveName(draft.name)
          }}
        >
          {t('clusters.saveAreaAsCluster')}
        </Button>
      )}
    </section>
  )
}
