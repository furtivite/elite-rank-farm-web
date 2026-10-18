'use client'

import { copyToClipboard } from '@/shared/lib/copyToClipboard'
import { Button } from '@/shared/ui/Button'
import { useTranslation, type TranslationKey } from '@/shared/lib/i18n'

export function CopyNameButton({ what, name }: { what: TranslationKey; name: string }) {
  const t = useTranslation()
  const label = t('basket.copy', { what: t(what), name })

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => copyToClipboard(name)}
      aria-label={label}
      title={label}
      className="min-h-8 px-2 text-xs"
    >
      Copy
    </Button>
  )
}
