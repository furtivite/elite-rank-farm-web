import { SkeletonLine } from '@/shared/ui/Skeleton'

export function BlockedBaseCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-2 rounded-md border border-warm-300 bg-white p-3 text-sm dark:border-warm-600 dark:bg-warm-950"
    >
      <div className="flex flex-col gap-1">
        <span className="block w-40 text-base">
          <SkeletonLine />
        </span>
        <SkeletonLine width="half" />
      </div>
      <SkeletonLine width="wide" />
    </div>
  )
}
