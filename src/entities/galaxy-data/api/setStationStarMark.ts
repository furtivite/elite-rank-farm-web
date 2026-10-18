import { withBasePath } from '@/shared/config/basePath'

export async function setStationStarMark(stationId: string, marked: boolean): Promise<boolean> {
  try {
    const response = await fetch(withBasePath('/api/galaxy/station-star'), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId, marked }),
    })

    return response.ok
  } catch {
    return false
  }
}
