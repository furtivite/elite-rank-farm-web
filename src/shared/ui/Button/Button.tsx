import cn from 'classnames'
import type { ButtonHTMLAttributes } from 'react'
import { BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS, type ButtonVariant } from '@/shared/ui/Button'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  const classes = cn(BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS[variant], className)

  return <button type={type} className={classes} {...props} />
}
