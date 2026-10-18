import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupMissions } from '@/entities/mission-store/lib/groupMissions'
import { jumpsAt, mission } from '@/entities/mission-store/lib/missionFixture'

test('система дальше одного прыжка опускается ниже (50.4, критерии 16.5-16.6)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Далеко', targetSystemId: 'far' }),
      mission({ targetSystem: 'Близко', targetSystemId: 'near' }),
    ],
    {
      jumps: new Map([
        ['far', jumpsAt(35)],
        ['near', jumpsAt(5)],
      ]),
    },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Близко', 'Далеко'],
  )
  assert.equal(groups[0].jumps?.minJumps, 1)
  assert.equal(groups[0].jumps?.isFar, false)
  assert.equal(groups[1].jumps?.minJumps, 4)
  assert.equal(groups[1].jumps?.isFar, true)
})

test('штраф нарастает: три прыжка ниже двух (50.4)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Три', targetSystemId: 'three' }),
      mission({ targetSystem: 'Два', targetSystemId: 'two' }),
    ],
    {
      jumps: new Map([
        ['three', jumpsAt(25)],
        ['two', jumpsAt(15)],
      ]),
    },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Два', 'Три'],
  )
})

test('прыжки перебивают число заданий (90)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Близко', targetSystemId: 'near' }),
      mission({ targetSystem: 'Далеко', targetSystemId: 'far' }),
      mission({ targetSystem: 'Далеко', targetSystemId: 'far' }),
      mission({ targetSystem: 'Далеко', targetSystemId: 'far' }),
      mission({ targetSystem: 'Далеко', targetSystemId: 'far' }),
    ],
    {
      jumps: new Map([
        ['far', jumpsAt(95)],
        ['near', jumpsAt(5)],
      ]),
    },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Близко', 'Далеко'],
  )
})

test('цель с неизвестным расстоянием не штрафуется (50.4)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Аноним' }),
      mission({ targetSystem: 'Далеко', targetSystemId: 'far' }),
    ],
    { jumps: new Map([['far', jumpsAt(35)]]) },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Аноним', 'Далеко'],
  )
  assert.equal(groups[0].jumps, null)
})

test('без оценок прыжков порядок ровно прежний', () => {
  const missions = [
    mission({ targetSystem: 'Одна', targetSystemId: 'one' }),
    mission({ targetSystem: 'Две', targetSystemId: 'two' }),
    mission({ targetSystem: 'Две', targetSystemId: 'two' }),
  ]

  assert.deepEqual(
    groupMissions(missions).map((group) => group.systemName),
    ['Две', 'Одна'],
  )
  assert.equal(groupMissions(missions)[0].jumps, null)
})

test('при равном числе миссий ближе по supercruise выше (16.7)', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'Далёкая', targetStationId: 'far' }),
      mission({ targetStation: 'Ближняя', targetStationId: 'near' }),
    ],
    {
      stationDistanceLs: new Map([
        ['far', 4200],
        ['near', 180],
      ]),
    },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['Ближняя', 'Далёкая'],
  )
})

test('неизвестный supercruise не считается дальним, но идёт после известного', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'Без данных' }),
      mission({ targetStation: 'Далёкая', targetStationId: 'far' }),
    ],
    { stationDistanceLs: new Map([['far', 4200]]) },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['Далёкая', 'Без данных'],
  )
})

test('supercruise важнее числа миссий (68.2, отменяет прежнее правило 16.7)', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'Далёкая', targetStationId: 'far' }),
      mission({ targetStation: 'Далёкая', targetStationId: 'far' }),
      mission({ targetStation: 'Ближняя', targetStationId: 'near' }),
    ],
    {
      stationDistanceLs: new Map([
        ['far', 4200],
        ['near', 180],
      ]),
    },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['Ближняя', 'Далёкая'],
  )
})

test('при равном расстоянии выше та станция, где миссий больше (16.1)', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'Одна', targetStationId: 'one' }),
      mission({ targetStation: 'Три', targetStationId: 'three' }),
      mission({ targetStation: 'Три', targetStationId: 'three' }),
      mission({ targetStation: 'Три', targetStationId: 'three' }),
    ],
    {
      stationDistanceLs: new Map([
        ['one', 500],
        ['three', 500],
      ]),
    },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['Три', 'Одна'],
  )
})
