import { en } from '@/shared/lib/i18n/dictionary/en'
import { ru } from '@/shared/lib/i18n/dictionary/ru'

export function Bilingual({ k }: { k: keyof typeof en }) {
  return (
    <>
      <span lang="en" data-lang="en">
        {en[k]}
      </span>
      <span lang="ru" data-lang="ru">
        {ru[k]}
      </span>
    </>
  )
}
