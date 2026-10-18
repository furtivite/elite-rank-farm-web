import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

export function mergeClusters(
  left: readonly SavedFarmCluster[],
  right: readonly SavedFarmCluster[],
): SavedFarmCluster[] {
  const byId = new Map(left.map((cluster) => [cluster.id, cluster]))

  for (const cluster of right) {
    const current = byId.get(cluster.id)

    if (current === undefined || cluster.updatedAt > current.updatedAt) {
      byId.set(cluster.id, cluster)
    }
  }

  return [...byId.values()].sort((first, second) => first.createdAt.localeCompare(second.createdAt))
}
