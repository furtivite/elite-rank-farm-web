'use client'

import { useEffect, useRef } from 'react'

const SAVE_DELAY_MS = 800

export type AccountSyncFetch<T> =
  { status: 'success'; items: T } | { status: 'guest' } | { status: 'unavailable' }

export type AccountSyncPort<T> = {
  fetchRemote: () => Promise<AccountSyncFetch<T>>
  saveRemote: (items: T) => Promise<T | null>
  forgetRemote: (ids: readonly string[]) => Promise<T | null>
  readLocal: () => T
  writeLocal: (items: T) => void
  subscribeLocal: (listener: () => void) => () => void
  subscribeForgotten: (listener: (ids: readonly string[]) => void) => () => void
  merge: (local: T, remote: T) => T
  same: (left: T, right: T) => boolean
}

export function useAccountSync<T>(isSignedIn: boolean, port: AccountSyncPort<T>): void {
  const latest = useRef(port)

  useEffect(() => {
    latest.current = port
  })

  const loaded = useRef(false)
  const lastSaved = useRef<T | null>(null)

  useEffect(() => {
    loaded.current = false
    lastSaved.current = null

    if (!isSignedIn) {
      return
    }

    let cancelled = false

    void latest.current.fetchRemote().then((result) => {
      if (cancelled) {
        return
      }

      if (result.status === 'success') {
        const { merge, readLocal, writeLocal, same, saveRemote } = latest.current
        const merged = merge(readLocal(), result.items)
        writeLocal(merged)
        lastSaved.current = result.items

        if (!same(merged, result.items)) {
          void saveRemote(merged).then((saved) => {
            if (!cancelled && saved !== null) {
              lastSaved.current = saved
            }
          })
        }
      } else {
        lastSaved.current = null
      }

      loaded.current = true
    })

    return () => {
      cancelled = true
    }
  }, [isSignedIn])

  useEffect(() => {
    if (!isSignedIn) {
      return
    }

    let timer: number | undefined

    const schedule = () => {
      if (!loaded.current) {
        return
      }

      const { readLocal, same, saveRemote } = latest.current
      const current = readLocal()
      if (lastSaved.current !== null && same(current, lastSaved.current)) {
        return
      }

      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        void saveRemote(current).then((saved) => {
          if (saved !== null) {
            lastSaved.current = saved
          }
        })
      }, SAVE_DELAY_MS)
    }

    const unsubscribe = latest.current.subscribeLocal(schedule)

    return () => {
      unsubscribe()
      window.clearTimeout(timer)
    }
  }, [isSignedIn])

  useEffect(() => {
    if (!isSignedIn) {
      return
    }

    return latest.current.subscribeForgotten((ids) => {
      void latest.current.forgetRemote(ids).then((items) => {
        if (items !== null) {
          lastSaved.current = items
        }
      })
    })
  }, [isSignedIn])
}
