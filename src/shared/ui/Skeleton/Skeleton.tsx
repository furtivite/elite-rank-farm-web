import cn from 'classnames'
import type { ReactNode } from 'react'

export function LoadingArea({
  isLoading,
  children,
  className,
}: {
  isLoading: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      aria-busy={isLoading || undefined}
      inert={isLoading}
      className={cn(
        className,
        isLoading && 'pointer-events-none select-none blur-[2px] transition-[filter]',
      )}
    >
      {children}
    </div>
  )
}

export function SkeletonLine({ width = 'full' }: { width?: 'full' | 'wide' | 'half' | 'short' }) {
  const widthClassName =
    width === 'full' ? 'w-full' : width === 'wide' ? 'w-4/5' : width === 'half' ? 'w-1/2' : 'w-1/4'

  return (
    <span
      aria-hidden="true"
      className={cn('skeleton-line block rounded-sm bg-warm-300 dark:bg-warm-700', widthClassName)}
    />
  )
}

export function SkeletonLines({
  count,
  label,
  className,
}: {
  count: number
  label: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonLine key={index} width={index % 3 === 2 ? 'half' : 'wide'} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
