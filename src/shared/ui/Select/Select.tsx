import cn from 'classnames'
import type { Ref, SelectHTMLAttributes } from 'react'

export function Select({
  className,
  children,
  ref,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <span className="relative block">
      <select {...rest} ref={ref} className={cn(className, 'h-11 appearance-none pr-8')}>
        {children}
      </select>
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-warm-700 dark:text-warm-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6.5 8 10.5l4-4" />
      </svg>
    </span>
  )
}
