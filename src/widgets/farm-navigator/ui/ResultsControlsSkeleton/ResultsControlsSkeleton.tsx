import { SkeletonLine } from '@/shared/ui/Skeleton'

export function ResultsControlsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <span className="min-h-4 text-xs">
            <SkeletonLine width="short" />
          </span>
          <span className="block min-h-11 rounded-md border border-warm-300 dark:border-warm-700" />
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <span className="min-h-4 text-xs" />
        <span className="flex min-h-11 items-center gap-2">
          <span className="block size-4 rounded-sm bg-warm-300 dark:bg-warm-700" />
          <span className="block w-32">
            <SkeletonLine />
          </span>
        </span>
        <span className="block w-40 text-xs">
          <SkeletonLine />
        </span>
      </div>

      <span className="block w-40 text-xs sm:col-span-2 xl:col-span-3">
        <SkeletonLine />
      </span>
    </div>
  )
}
