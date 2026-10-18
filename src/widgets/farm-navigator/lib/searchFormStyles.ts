import type { PadSizeOption } from '@/features/farm-recommender'
import type { TranslationKey } from '@/shared/lib/i18n'

export const PAD_OPTION_LABELS: Record<Exclude<PadSizeOption, ''>, string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
}

export function padOptionLabel(option: PadSizeOption, t: (key: TranslationKey) => string): string {
  return option === '' ? t('search.padAny') : PAD_OPTION_LABELS[option]
}

export const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-2 text-sm text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

export const labelClassName = 'min-h-4 text-xs font-medium text-warm-700 dark:text-warm-300'

export const hintClassName = 'min-h-4 text-xs text-warm-600 dark:text-warm-400'
