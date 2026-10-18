import type { ReturnReminder } from '@/entities/mission-store'

export function newReminder(systemName: string, stationName: string): ReturnReminder {
  return {
    id: `ret-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    systemName,
    stationName,
    createdAt: new Date().toISOString(),
  }
}
