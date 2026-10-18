import { SkeletonLine } from '@/shared/ui/Skeleton'

export function SystemRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-b border-warm-300 px-2 py-2 text-sm dark:border-warm-700"
    >
      <span className="flex h-5 w-full items-center gap-2">
        <span className="w-3" />
        <span className="w-32">
          <SkeletonLine />
        </span>
        <span className="w-24">
          <SkeletonLine />
        </span>
      </span>
    </div>
  )
}
