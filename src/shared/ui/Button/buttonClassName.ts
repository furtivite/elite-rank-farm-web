import cn from 'classnames'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export const BUTTON_BASE_CLASS = cn(
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-4 text-base font-medium',
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700',
  'dark:focus-visible:outline-orange-400',
  'active:translate-y-px motion-reduce:active:translate-y-0 motion-reduce:transition-none',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0',
)

export const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-aubergine-700 text-white hover:bg-aubergine-800 active:bg-aubergine-900 ' +
    'dark:bg-orange-500 dark:text-warm-950 dark:hover:bg-orange-400 dark:active:bg-orange-600',
  secondary:
    'border border-warm-300 bg-white text-warm-900 hover:bg-warm-100 active:bg-warm-200 ' +
    'dark:border-warm-600 dark:bg-warm-900 dark:text-warm-100 dark:hover:bg-warm-800 dark:active:bg-warm-700',
  danger:
    'bg-danger-700 text-white hover:bg-danger-600 active:bg-danger-800 ' +
    'dark:bg-danger-600 dark:hover:bg-danger-500 dark:active:bg-danger-700',
}
