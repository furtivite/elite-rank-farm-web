'use client'

import {
  getResultsOrderSnapshot,
  getResultsPageSizeSnapshot,
  getServerResultsOrderSnapshot,
  getServerResultsPageSizeSnapshot,
  subscribeToResultsOrder,
  subscribeToResultsPageSize,
} from '@/shared/lib/resultsOrder'
import { PROGRESSIVE_PAGE_SIZE_SYSTEMS } from '@/shared/lib/progressiveList'
import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  FINE_COVERAGE_NOTE_KEY,
  fineForFaction,
  useCommanderState,
} from '@/entities/commander-state'
import { useSession } from '@/entities/session'
import { useSystemRefresh } from '@/entities/galaxy-data'
import { startOfDay } from '@/shared/lib/freshness'
import { useTranslation } from '@/shared/lib/i18n'
import { useNow } from '@/shared/lib/useNow'
import { useMissionStore } from '@/entities/mission-store'
import { useStationRatings } from '@/entities/station-rating'
import { useFarmClusters } from '@/entities/farm-cluster'
import { useClusterActions } from '@/views/home/lib/useClusterActions'
import {
  buildScoredGroups,
  completedSides,
  DEFAULT_RESULTS_SORT,
  effectiveFarmMode,
  EMPTY_RESULTS_FILTER,
  FARM_MODE_TO_REGION,
  filterScoredGroups,
  sortScoredGroups,
  rankClusters,
  useClusterComparison,
  useClusterDiscovery,
  useFarmSearch,
  useJumpOrigin,
  type ClusterSearchMode,
  type FarmMode,
  type FarmSearchParams,
  type ResultsFilter,
  type ResultsSort,
} from '@/features/farm-recommender'
import {
  getJumpMultiplierSnapshot,
  getServerJumpMultiplierSnapshot,
  subscribeToJumpMultiplier,
} from '@/shared/lib/searchRadius'
import { LoadingArea } from '@/shared/ui/Skeleton'
import { AppShell } from '@/widgets/app-shell'
import { ClusterComparison, FarmClusterPanel } from '@/widgets/farm-clusters'
import {
  FarmResults,
  FarmSearchForm,
  ResultsControls,
  ResultsControlsSkeleton,
} from '@/widgets/farm-navigator'
import { MissionBasket } from '@/widgets/mission-basket'

export function HomePage() {
  const session = useSession()
  const commander = useCommanderState(
    session.status === 'user',
    session.user?.isTestUser === true,
    session.status === 'guest',
  )
  const { status, errorMessage, groups, lastParams, search } = useFarmSearch()
  const systemRefresh = useSystemRefresh(() => {
    if (lastParams !== null) {
      void search(lastParams)
    }
  })
  const { ratings, setRating } = useStationRatings()
  const missionStore = useMissionStore()
  const [chosenMode, setMode] = useState<FarmMode>('empire')
  const { clusters, saveCluster, renameCluster, removeCluster } = useFarmClusters()
  const [clusterMode, setClusterMode] = useState<ClusterSearchMode>('auto')
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const comparison = useClusterComparison()
  const discovery = useClusterDiscovery()
  const [lastRequest, setLastRequest] = useState<FarmSearchParams | null>(null)
  const commanderState = commander.data?.state ?? null
  const completed = completedSides(commanderState, commander.progress)
  const mode = effectiveFarmMode(chosenMode, completed)
  const regionKey = FARM_MODE_TO_REGION[mode]
  const regionClusters = clusters.filter(
    (cluster) => regionKey === 'galaxy' || cluster.region === regionKey,
  )
  const selectedCluster = regionClusters.find((cluster) => cluster.id === selectedClusterId) ?? null
  const [filter, setFilter] = useState<ResultsFilter>(EMPTY_RESULTS_FILTER)
  const resultsOrder = useSyncExternalStore(
    subscribeToResultsOrder,
    getResultsOrderSnapshot,
    getServerResultsOrderSnapshot,
  )
  const pageSize = useSyncExternalStore(
    subscribeToResultsPageSize,
    getResultsPageSizeSnapshot,
    getServerResultsPageSizeSnapshot,
  )
  const [systemLimit, setSystemLimit] = useState(PROGRESSIVE_PAGE_SIZE_SYSTEMS)
  const [sort, setSort] = useState<ResultsSort>(DEFAULT_RESULTS_SORT)

  const runSearch = (params: FarmSearchParams, limit: number = pageSize) => {
    setLastRequest(params)
    setSystemLimit(limit)

    if (clusterMode === 'better') {
      void comparison.compare(params, regionClusters)
    }

    void search({
      ...params,
      systemLimit: resultsOrder === 'nearest' ? limit : undefined,
      area:
        clusterMode === 'stay' && selectedCluster !== null
          ? { centerSystem: selectedCluster.centerSystem, radiusLy: selectedCluster.radiusLy }
          : undefined,
    })
  }

  const t = useTranslation()
  const now = useNow()
  const scoringNow = now === null ? null : startOfDay(now)
  const scoredGroups = useMemo(
    () =>
      buildScoredGroups(t, groups, ratings, missionStore.missions, scoringNow ?? undefined, mode),
    [t, groups, ratings, missionStore.missions, scoringNow, mode],
  )

  const jumpOrigin = useJumpOrigin(commanderState, lastParams)
  const jumpMultiplier = useSyncExternalStore(
    subscribeToJumpMultiplier,
    getJumpMultiplierSnapshot,
    getServerJumpMultiplierSnapshot,
  )

  const {
    discoverClusterCandidates,
    saveDiscovered,
    changeClusterMode,
    chooseCluster,
    clusterDraft,
  } = useClusterActions({
    mode,
    regionKey,
    regionClusters,
    lastRequest,
    jumpOrigin,
    jumpMultiplier,
    discovery,
    comparison,
    saveCluster,
    setSelectedClusterId,
    setClusterMode,
    search,
  })

  const clusterSummaries = useMemo(
    () =>
      rankClusters(t, comparison.results, ratings, missionStore.missions, scoringNow ?? undefined),
    [t, comparison.results, ratings, missionStore.missions, scoringNow],
  )

  const visibleGroups = useMemo(
    () => sortScoredGroups(filterScoredGroups(scoredGroups, filter, mode), sort),
    [scoredGroups, filter, sort, mode],
  )

  return (
    <AppShell
      farmMode={mode}
      activeNav="home"
      commander={commander}
      session={session}
      notice={
        <p className="text-xs text-warm-600 dark:text-warm-400">{t(FINE_COVERAGE_NOTE_KEY)}</p>
      }
      aside={
        <MissionBasket
          regionKey={FARM_MODE_TO_REGION[mode]}
          store={missionStore}
          commander={commander}
          position={
            commanderState === null
              ? null
              : {
                  systemName: commanderState.currentSystem.name,
                  stationName: commanderState.currentStation,
                }
          }
          jumpOrigin={jumpOrigin}
        />
      }
    >
      <div className="rounded-md border border-warm-300 p-2 dark:border-warm-700">
        <FarmSearchForm
          onSearch={runSearch}
          isLoading={status === 'loading' || comparison.status === 'loading'}
          commanderState={commanderState}
          mode={mode}
          onModeChange={setMode}
          completedSides={completed}
          clusterSummary={selectedCluster === null ? undefined : selectedCluster.name}
          advancedExtra={
            <FarmClusterPanel
              clusterMode={clusterMode}
              onClusterModeChange={changeClusterMode}
              clusters={regionClusters}
              selectedClusterId={selectedCluster?.id ?? null}
              onSelectCluster={setSelectedClusterId}
              draft={clusterDraft}
              onSave={(draft) => setSelectedClusterId(saveCluster(draft).id)}
              onRename={renameCluster}
              onRemove={removeCluster}
              discovery={discovery}
              onDiscover={discoverClusterCandidates}
              onSaveCandidate={saveDiscovered}
            />
          }
        />
      </div>

      {status === 'loading' || status === 'success' ? (
        <LoadingArea
          isLoading={status === 'loading'}
          className="rounded-md border border-warm-300 p-2 dark:border-warm-700"
        >
          {status === 'loading' ? (
            <ResultsControlsSkeleton />
          ) : (
            <ResultsControls
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
              shownCount={visibleGroups.length}
              totalCount={scoredGroups.length}
              farmMode={mode}
            />
          )}
        </LoadingArea>
      ) : null}

      {clusterMode === 'better' ? (
        <ClusterComparison
          status={comparison.status}
          errorMessage={comparison.errorMessage}
          summaries={clusterSummaries}
          selectedClusterId={selectedCluster?.id ?? null}
          onChoose={chooseCluster}
        />
      ) : null}

      <FarmResults
        pageSize={pageSize}
        onLoadMore={
          resultsOrder === 'nearest' && lastRequest !== null && groups.length >= systemLimit
            ? () => runSearch(lastRequest, systemLimit + pageSize)
            : undefined
        }
        fineFor={(scored) => fineForFaction(commander, scored.station.controllingFaction?.name)}
        status={status}
        errorMessage={errorMessage}
        groups={visibleGroups}
        onSetRating={setRating}
        onAddMission={missionStore.addMission}
        refresh={systemRefresh}
        farmMode={mode}
      />
    </AppShell>
  )
}
