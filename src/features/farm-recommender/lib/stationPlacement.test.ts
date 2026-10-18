import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  passesSurfaceFilter,
  stationPlacement,
  passesStarFilter,
} from '@/features/farm-recommender/lib/stationPlacement'

test('распознаёт орбитальные типы из реального датасета', () => {
  for (const type of [
    'Outpost',
    'Coriolis Starport',
    'Orbis Starport',
    'Ocellus Starport',
    'Dodec Starport',
    'Asteroid base',
    'Space Construction Depot',
  ]) {
    assert.equal(stationPlacement({ type }), 'orbital', type)
  }
})

test('распознаёт поверхностные типы из реального датасета', () => {
  for (const type of [
    'Settlement',
    'Planetary Outpost',
    'Planetary Port',
    'Planetary Construction Depot',
  ]) {
    assert.equal(stationPlacement({ type }), 'surface', type)
  }
})

test('неизвестный тип не выдаётся за орбитальный', () => {
  assert.equal(stationPlacement({ type: 'None' }), 'unknown')
  assert.equal(stationPlacement({ type: undefined }), 'unknown')
  assert.equal(stationPlacement({ type: '   ' }), 'unknown')
})

test('распознаёт по признаку, а не по точному списку', () => {
  assert.equal(stationPlacement({ type: 'Planetary Fortress' }), 'surface')
  assert.equal(stationPlacement({ type: 'Odyssey Settlement' }), 'surface')
})

test('фильтр убирает поверхность и сохраняет неизвестное', () => {
  assert.equal(passesSurfaceFilter({ type: 'Settlement' }, true), false)
  assert.equal(passesSurfaceFilter({ type: 'Coriolis Starport' }, true), true)
  assert.equal(passesSurfaceFilter({ type: 'None' }, true), true)
})

test('выключенный фильтр не убирает ничего', () => {
  assert.equal(passesSurfaceFilter({ type: 'Settlement' }, false), true)
})

test('фильтр «без других звёзд» убирает станции у неглавной звезды (86.12)', () => {
  assert.equal(passesStarFilter({ star: { isMain: false } }, true), false)
  assert.equal(passesStarFilter({ star: { isMain: true } }, true), true)
})

test('станция без сведений о звезде фильтром не трогается', () => {
  assert.equal(passesStarFilter({}, true), true)
})

test('выключенный фильтр не трогает никого', () => {
  assert.equal(passesStarFilter({ star: { isMain: false } }, false), true)
  assert.equal(passesStarFilter({}, false), true)
})
