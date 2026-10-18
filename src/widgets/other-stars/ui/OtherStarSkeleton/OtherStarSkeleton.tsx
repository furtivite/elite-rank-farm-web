import { SkeletonLine } from '@/shared/ui/Skeleton'

export function OtherStarSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="flex flex-col gap-2 rounded-md border border-warm-300 p-3 dark:border-warm-700"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="block w-40">
          <SkeletonLine />
        </span>
        <span className="block w-24">
          <SkeletonLine />
        </span>
      </div>
      <SkeletonLine width="half" />
    </li>
  )
}
