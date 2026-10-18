export const PROGRESSIVE_PAGE_SIZE = 50

export const PROGRESSIVE_PAGE_SIZE_SYSTEMS = 25

export type ProgressiveState = {
  key: string
  pages: number
}

export const PROGRESSIVE_START: ProgressiveState = { key: '', pages: 1 }

export type ProgressiveSlice<T> = {
  shown: T[]
  rest: number
  nextChunk: number
  next: ProgressiveState
}

export function progressiveSlice<T>(
  items: readonly T[],
  state: ProgressiveState,
  key: string,
  pageSize: number = PROGRESSIVE_PAGE_SIZE,
): ProgressiveSlice<T> {
  const pages = state.key === key ? Math.max(1, state.pages) : 1
  const limit = pages * pageSize
  const shown = items.slice(0, limit)
  const rest = items.length - shown.length

  return {
    shown,
    rest,
    nextChunk: Math.min(rest, pageSize),
    next: { key, pages: pages + 1 },
  }
}
