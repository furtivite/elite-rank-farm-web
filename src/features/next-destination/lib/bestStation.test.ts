import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupMissions } from '@/entities/mission-store'
import { mission } from '@/entities/mission-store/lib/missionFixture'
import { bestStation } from '@/features/next-destination/lib/bestStation'

test('«куда дальше» не зовёт к заданиям, которые ждут товара (70.6)', () => {
  const [system] = groupMissions([
    mission({ targetSystem: 'Ngalinn', targetStation: 'Alpha', awaitingCargo: true }),
    mission({ targetSystem: 'Ngalinn', targetStation: 'Alpha', awaitingCargo: true }),
    mission({ targetSystem: 'Ngalinn', targetStation: 'Beta' }),
  ])
  assert.ok(system)

  assert.equal(bestStation(system, undefined)?.station.stationName, 'Beta')
})
