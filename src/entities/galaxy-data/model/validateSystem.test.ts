import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCachedSystem } from '@/entities/galaxy-data/model/validateSystem'

function validSystem(): Record<string, unknown> {
  return {
    id: '1109989017963',
    name: 'Ngalinn',
    x: 8.625,
    y: -219.84375,
    z: -60.84375,
    regionIds: ['imperial-ngalinn'],
    updatedAt: '2026-09-04T00:00:00Z',
    systemFactions: [{ name: 'Ngalinn Empire Party', allegiance: 'Empire' }],
    systemFactionSummary: { imperial: 1, federal: 0, alliance: 0, independent: 0, other: 0 },
    stations: [
      {
        id: 'st-1',
        systemId: '1109989017963',
        name: 'Hickam Survey',
        type: 'Outpost',
        maxPadSize: 'M',
        distanceToArrivalLs: 800,
        updatedAt: '2026-09-04T00:00:00Z',
      },
    ],
  }
}

test('полная система разбирается целиком', () => {
  const system = parseCachedSystem(validSystem())

  assert.ok(system)
  assert.equal(system?.name, 'Ngalinn')
  assert.equal(system?.stations.length, 1)
  assert.equal(system?.stations[0].maxPadSize, 'M')
  assert.equal(system?.stations[0].distanceToArrivalLs, 800)
})

test('система без координат отбрасывается, а не доезжает до поиска', () => {
  const broken = validSystem()
  delete broken.x

  assert.equal(parseCachedSystem(broken), null)
})

test('незнакомый регион отбрасывается', () => {
  assert.equal(parseCachedSystem({ ...validSystem(), regionIds: ['sol-something'] }), null)
})

test('станция из чужой системы не попадает в кэш системы', () => {
  const foreign = validSystem()
  foreign.stations = [
    {
      id: 'st-9',
      systemId: '999',
      name: 'Elsewhere',
      updatedAt: '2026-09-04T00:00:00Z',
    },
  ]

  assert.equal(parseCachedSystem(foreign), null)
})

test('состав фракций станции всегда unknown, что бы ни прислал сервер', () => {
  const claimed = validSystem()
  const [station] = claimed.stations as Record<string, unknown>[]
  station.missionProviderFactions = { status: 'known', factions: [] }

  const system = parseCachedSystem(claimed)
  assert.deepEqual(system?.stations[0].missionProviderFactions, { status: 'unknown' })
})

test('неизвестный размер площадки не выдумывается, а опускается', () => {
  const odd = validSystem()
  const [station] = odd.stations as Record<string, unknown>[]
  station.maxPadSize = 'XL'

  const system = parseCachedSystem(odd)
  assert.ok(system)
  assert.equal(system?.stations[0].maxPadSize, undefined)
})

test('не-объект разбором не считается', () => {
  assert.equal(parseCachedSystem(null), null)
  assert.equal(parseCachedSystem('Ngalinn'), null)
  assert.equal(parseCachedSystem([validSystem()]), null)
})

function withStar(star: unknown) {
  const system = validSystem()
  return parseCachedSystem({
    ...system,
    stations: [{ ...(system.stations as Record<string, unknown>[])[0], star }],
  })
}

test('звезда станции разбирается из снимка', () => {
  const parsed = withStar({ name: 'HIP 6807 B', isMain: false, source: 'dump' })

  assert.deepEqual(parsed?.stations[0].star, {
    isMain: false,
    source: 'dump',
    name: 'HIP 6807 B',
  })
})

test('ручная отметка разбирается без имени звезды (86)', () => {
  const parsed = withStar({ isMain: false, source: 'manual' })

  assert.deepEqual(parsed?.stations[0].star, { isMain: false, source: 'manual' })
})

test('снимок без источника читается как дамп (86)', () => {
  const parsed = withStar({ name: 'HIP 6807 B', isMain: false })

  assert.deepEqual(parsed?.stations[0].star, {
    isMain: false,
    source: 'dump',
    name: 'HIP 6807 B',
  })
})

test('половинчатая звезда не принимается', () => {
  assert.equal(withStar({ name: 'HIP 6807 B' })?.stations[0].star, undefined)
})

test('станция без звезды разбирается как прежде', () => {
  const parsed = parseCachedSystem(validSystem())

  assert.ok(parsed !== null)
  assert.equal(parsed?.stations[0].star, undefined)
})
