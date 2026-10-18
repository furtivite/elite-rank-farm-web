import assert from 'node:assert/strict'
import test from 'node:test'

import { SHIPS, getRequiredPadSize, getShipInfo } from '@/entities/ship/model/ships'

const EXPECTED_TOTAL = 48
const EXPECTED_BY_PAD = { S: 16, M: 21, L: 11 } as const

test('справочник содержит все актуальные корпуса', () => {
  assert.equal(Object.keys(SHIPS).length, EXPECTED_TOTAL)
})

test('распределение по размерам площадок совпадает с источниками', () => {
  const counts = { S: 0, M: 0, L: 0 }
  for (const info of Object.values(SHIPS)) {
    counts[info.padSize] += 1
  }
  assert.deepEqual(counts, EXPECTED_BY_PAD)
})

test('нет дубликатов Journal ID даже без учёта регистра', () => {
  const ids = Object.keys(SHIPS)
  const normalized = new Set(ids.map((id) => id.toLowerCase()))
  assert.equal(normalized.size, ids.length)
})

test('нет двух ID для одного корабля', () => {
  const names = Object.values(SHIPS).map((info) => info.name)
  assert.equal(new Set(names).size, names.length)
})

test('getShipInfo находит корабль по каноническому ID', () => {
  assert.deepEqual(getShipInfo('Type6'), { name: 'Type-6 Transporter', padSize: 'M' })
  assert.deepEqual(getShipInfo('Cutter'), { name: 'Imperial Cutter', padSize: 'L' })
  assert.deepEqual(getShipInfo('Python_NX'), { name: 'Python MkII', padSize: 'M' })
})

test('getShipInfo не зависит от регистра — игра пишет и Python, и python', () => {
  assert.deepEqual(getShipInfo('python'), getShipInfo('Python'))
  assert.deepEqual(getShipInfo('type8'), getShipInfo('Type8'))
  assert.deepEqual(getShipInfo('mediumtransport01'), getShipInfo('MediumTransport01'))
  assert.deepEqual(getShipInfo('SMALLCOMBAT01_NX'), getShipInfo('SmallCombat01_NX'))
})

test('неизвестный корпус не бросает исключение', () => {
  assert.equal(getShipInfo('empire_fighter'), undefined)
  assert.equal(getShipInfo(''), undefined)
  assert.equal(getRequiredPadSize('testbuggy'), null)
})

test('getRequiredPadSize отдаёт минимальную площадку', () => {
  assert.equal(getRequiredPadSize('SideWinder'), 'S')
  assert.equal(getRequiredPadSize('Type7'), 'L')
  assert.equal(getRequiredPadSize('LakonMiner'), 'M')
})
