'use client'

import {
  fetchUserClusters,
  forgetUserClusters,
  getClustersSnapshot,
  mergeClusters,
  saveUserClusters,
  subscribeToClusters,
  subscribeToForgottenClusters,
  writeClusters,
  type SavedFarmCluster,
} from '@/entities/farm-cluster'
import { useAccountSync } from '@/shared/lib/accountSync'

export function useFarmClustersSync(isSignedIn: boolean): void {
  useAccountSync<SavedFarmCluster[]>(isSignedIn, {
    fetchRemote: async () => {
      const result = await fetchUserClusters()

      return result.status === 'success'
        ? { status: 'success', items: result.clusters }
        : { status: result.status }
    },
    saveRemote: saveUserClusters,
    forgetRemote: forgetUserClusters,
    readLocal: getClustersSnapshot,
    writeLocal: writeClusters,
    subscribeLocal: subscribeToClusters,
    subscribeForgotten: subscribeToForgottenClusters,
    merge: mergeClusters,
    same: sameClusters,
  })
}

function sameClusters(
  left: readonly SavedFarmCluster[],
  right: readonly SavedFarmCluster[],
): boolean {
  if (left.length !== right.length) {
    return false
  }

  const byId = new Map(right.map((cluster) => [cluster.id, cluster.updatedAt]))

  return left.every((cluster) => byId.get(cluster.id) === cluster.updatedAt)
}
