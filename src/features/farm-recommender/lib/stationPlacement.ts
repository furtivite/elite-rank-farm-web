import type { CachedStation } from '@/entities/galaxy-data'

export type StationPlacement = 'orbital' | 'surface' | 'unknown'

const SURFACE_MARKERS = ['planetary', 'settlement', 'surface', 'workshop', 'crater']

const UNKNOWN_VALUES = ['', 'none', 'unknown', 'null']

export function stationPlacement(station: Pick<CachedStation, 'type'>): StationPlacement {
  const type = station.type?.trim().toLowerCase() ?? ''

  if (UNKNOWN_VALUES.includes(type)) {
    return 'unknown'
  }

  return SURFACE_MARKERS.some((marker) => type.includes(marker)) ? 'surface' : 'orbital'
}

export function passesSurfaceFilter(
  station: Pick<CachedStation, 'type'>,
  excludeSurface: boolean,
): boolean {
  return !excludeSurface || stationPlacement(station) !== 'surface'
}

export function passesStarFilter(
  station: { star?: { isMain: boolean } },
  excludeSecondaryStar: boolean,
): boolean {
  if (!excludeSecondaryStar) {
    return true
  }

  return station.star === undefined || station.star.isMain
}
