import { serializeMissionsForExport, type StoredMission } from '@/entities/mission-store'

const FILE_NAME = 'elite-missions.json'

export function downloadMissions(missions: readonly StoredMission[]): void {
  const blob = new Blob([serializeMissionsForExport(missions)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = FILE_NAME

  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
