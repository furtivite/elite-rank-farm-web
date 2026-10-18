import { isWorthLoading } from '@/features/farm-recommender/lib/worthLoading'
import {
  distanceLy,
  getRegionMeta,
  getSystemsInRadius,
  loadSystemsForEntries,
  resolveSystemCoords,
} from '@/entities/galaxy-data'
import type { Coords3D, RegionCliKey } from '@/entities/galaxy-data'
import {
  FARM_MODE_TO_REGION,
  type FarmSearchOrigin,
  type FarmSearchParams,
  type RawSystemGroup,
} from '@/features/farm-recommender/model/types'
import { isPadCompatible } from '@/features/farm-recommender/lib/padCompatibility'
import {
  passesStarFilter,
  passesSurfaceFilter,
} from '@/features/farm-recommender/lib/stationPlacement'
import { resolveSearchRadius } from '@/shared/lib/searchRadius'

async function resolveOrigin(
  regionKey: RegionCliKey,
  origin: FarmSearchOrigin,
): Promise<Coords3D | null> {
  if (origin.kind === 'coords') {
    return { x: origin.x, y: origin.y, z: origin.z }
  }

  return resolveSystemCoords(regionKey, origin.name)
}

async function regionRadius(regionKey: RegionCliKey): Promise<number | null> {
  try {
    return (await getRegionMeta(regionKey)).radiusLy
  } catch {
    return null
  }
}

export async function searchFarmCandidates(params: FarmSearchParams): Promise<RawSystemGroup[]> {
  const regionKey = FARM_MODE_TO_REGION[params.mode]

  const center = await resolveOrigin(regionKey, params.currentSystem)
  if (!center) {
    return []
  }

  const area = params.area ?? null
  const areaCenter =
    area === null ? center : await resolveSystemCoords(regionKey, area.centerSystem)
  if (!areaCenter) {
    return []
  }

  const radiusLy =
    area === null
      ? resolveSearchRadius(
          params.jumpRangeLy,
          params.jumpMultiplier ?? 1,
          await regionRadius(regionKey),
        ).radiusLy
      : area.radiusLy

  const reachable = await getSystemsInRadius(regionKey, areaCenter, radiusLy)

  const worthLoading = reachable.filter((entry) => isWorthLoading(entry, params.padSize))

  const materialized =
    params.systemLimit === undefined ? worthLoading : worthLoading.slice(0, params.systemLimit)

  const loaded = await loadSystemsForEntries(regionKey, materialized)
  const systems = new Map(loaded.map((system) => [system.id, system]))

  const groups: RawSystemGroup[] = []

  for (let i = 0; i < materialized.length; i += 1) {
    const system = systems.get(materialized[i].id)
    if (!system) {
      continue
    }

    let hiddenNoBoard = 0

    const stations = system.stations.filter((station) => {
      if (!passesSurfaceFilter(station, params.excludeSurface === true)) {
        return false
      }

      if (!passesStarFilter(station, params.excludeSecondaryStar === true)) {
        return false
      }

      if (station.hasMissionBoard === false && station.missionBoardSource === 'journal') {
        hiddenNoBoard += 1
        return false
      }

      return isPadCompatible(station.maxPadSize, params.padSize)
    })

    if (stations.length === 0) {
      continue
    }

    groups.push({
      systemId: system.id,
      systemName: system.name,
      distanceLy: area === null ? materialized[i].distanceLy : distanceLy(center, materialized[i]),
      stations,
      hiddenNoBoard,
      systemFactionSummary: system.systemFactionSummary,
      updatedAt: system.updatedAt,
      updatedBy: system.updatedBy,
    })
  }

  return groups
}
