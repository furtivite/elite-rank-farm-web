'use client'

import { OTHER_STARS_PAGE_SIZE_STORAGE_KEY } from '@/shared/config/storageKeys'
import { createPageSizeStore, PAGE_SIZES, type PageSize } from '@/shared/lib/pageSize'

export { PAGE_SIZES }

export type OtherStarsPageSize = PageSize

export const DEFAULT_OTHER_STARS_PAGE_SIZE: OtherStarsPageSize = 10

const store = createPageSizeStore<OtherStarsPageSize>(
  OTHER_STARS_PAGE_SIZE_STORAGE_KEY,
  DEFAULT_OTHER_STARS_PAGE_SIZE,
)

export const getOtherStarsPageSizeSnapshot = store.getSnapshot
export const getServerOtherStarsPageSizeSnapshot = store.getServerSnapshot
export const subscribeToOtherStarsPageSize = store.subscribe
export const writeOtherStarsPageSize = store.write
