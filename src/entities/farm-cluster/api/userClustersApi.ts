import { withBasePath } from '@/shared/config/basePath'
import { parseClusterList } from '@/entities/farm-cluster/model/validate'
import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

export type FetchClustersResult =
  | { status: 'success'; clusters: SavedFarmCluster[] }
  | { status: 'guest' }
  | { status: 'unavailable' }

const URL = withBasePath('/api/account/clusters')

function parse(payload: unknown): SavedFarmCluster[] {
  if (typeof payload !== 'object' || payload === null) {
    return []
  }

  return parseClusterList((payload as { clusters?: unknown }).clusters)
}

export async function fetchUserClusters(): Promise<FetchClustersResult> {
  let response: Response
  try {
    response = await fetch(URL, { credentials: 'include', cache: 'no-store' })
  } catch {
    return { status: 'unavailable' }
  }

  if (response.status === 401) {
    return { status: 'guest' }
  }
  if (!response.ok) {
    return { status: 'unavailable' }
  }

  try {
    return { status: 'success', clusters: parse(await response.json()) }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function saveUserClusters(
  clusters: readonly SavedFarmCluster[],
): Promise<SavedFarmCluster[] | null> {
  try {
    const response = await fetch(URL, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clusters }),
    })

    return response.ok ? parse(await response.json()) : null
  } catch {
    return null
  }
}

export async function forgetUserClusters(
  clusterIds: readonly string[],
): Promise<SavedFarmCluster[] | null> {
  try {
    const response = await fetch(URL, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clusterIds }),
    })

    return response.ok ? parse(await response.json()) : null
  } catch {
    return null
  }
}
