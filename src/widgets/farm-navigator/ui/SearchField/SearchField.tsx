'use client'

import cn from 'classnames'
import type { ReactNode } from 'react'
import { hintClassName, labelClassName } from '@/widgets/farm-navigator/lib/searchFormStyles'

type SearchFieldProps = {
  label?: string
  htmlFor?: string
  hint?: string
  hintId?: string
  className?: string
  children: ReactNode
}

export function SearchField({
  label,
  htmlFor,
  hint,
  hintId,
  className,
  children,
}: SearchFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {htmlFor === undefined ? (
        <span className={labelClassName} aria-hidden={label === undefined}>
          {label}
        </span>
      ) : (
        <label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </label>
      )}
      {children}
      <p id={hintId} className={hintClassName}>
        {hint}
      </p>
    </div>
  )
}
