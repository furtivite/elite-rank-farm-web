'use client'

import { RESULTS_PAGE_SIZE_STORAGE_KEY } from '@/shared/config/storageKeys'
import { createPageSizeStore, PAGE_SIZES, type PageSize } from '@/shared/lib/pageSize'

export { PAGE_SIZES }

export type ResultsPageSize = PageSize

export const DEFAULT_RESULTS_PAGE_SIZE: ResultsPageSize = 25

const store = createPageSizeStore<ResultsPageSize>(
  RESULTS_PAGE_SIZE_STORAGE_KEY,
  DEFAULT_RESULTS_PAGE_SIZE,
)

export const getResultsPageSizeSnapshot = store.getSnapshot
export const getServerResultsPageSizeSnapshot = store.getServerSnapshot
export const subscribeToResultsPageSize = store.subscribe
export const writeResultsPageSize = store.write
