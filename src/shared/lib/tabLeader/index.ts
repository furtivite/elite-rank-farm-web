export {
  claimPollingRole,
  LEADER_STALE_MS,
  releasePollingRole,
  shouldClaim,
  type LeaderClaim,
} from '@/shared/lib/tabLeader/tabLeader'
export { publishToTabs, subscribeToTabs, type TabMessage } from '@/shared/lib/tabLeader/tabChannel'
