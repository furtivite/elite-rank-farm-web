import { SkeletonLine } from '@/shared/ui/Skeleton'

export function BlockedInBasketSkeleton() {
  return (
    <li aria-hidden="true" className="flex flex-col gap-1">
      <SkeletonLine width="wide" />
      <span className="block h-8 w-24 rounded-md bg-warm-300 dark:bg-warm-700" />
    </li>
  )
}
