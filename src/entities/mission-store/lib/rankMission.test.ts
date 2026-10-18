import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import {
  activeRankSides,
  rankMissionLabel,
  rankMissionSide,
  rankSidesByStation,
  rankStationKey,
} from '@/entities/mission-store/lib/rankMission'

const ru = createTranslate('ru')

test('ранговые задания узнаются по имени из журнала (74.3)', () => {
  assert.equal(rankMissionSide('Mission_Courier_RankEmp'), 'imperial')
  assert.equal(rankMissionSide('Mission_Delivery_RankEmp'), 'imperial')
  assert.equal(rankMissionSide('Mission_Courier_RankFed'), 'federal')
  assert.equal(rankMissionSide('Mission_Delivery_RankFed'), 'federal')
})

test('обычные задания ранговыми не считаются', () => {
  assert.equal(rankMissionSide('Mission_Courier'), null)
  assert.equal(rankMissionSide('Mission_AltruismCredits'), null)
  assert.equal(rankMissionSide('Mission_Courier_War'), null)
  assert.equal(rankMissionSide(undefined), null)
})

test('регистр имени не влияет', () => {
  assert.equal(rankMissionSide('MISSION_COURIER_RANKEMP'), 'imperial')
})

test('у звёздочки есть подпись словами', () => {
  assert.equal(rankMissionLabel('imperial', ru), 'ранговое задание Империи')
  assert.equal(rankMissionLabel('federal', ru), 'ранговое задание Федерации')
  assert.equal(rankMissionLabel(null, ru), null)
})

test('станция с ранговым заданием опознаётся по системе и имени', () => {
  const sides = rankSidesByStation([
    {
      name: 'Mission_Courier_RankEmp',
      destinationSystem: 'Ngalinn',
      destinationStation: 'Hickam Survey',
    },
    {
      name: 'Mission_Courier',
      destinationSystem: 'HIP 8060',
      destinationStation: 'Fernandes Base',
    },
  ])

  assert.equal(sides.get(rankStationKey('Ngalinn', 'Hickam Survey')), 'imperial')
  assert.equal(sides.get(rankStationKey('HIP 8060', 'Fernandes Base')), undefined)
})

test('регистр и пробелы в именах станции не мешают совпадению', () => {
  const sides = rankSidesByStation([
    {
      name: 'Mission_Delivery_RankFed',
      destinationSystem: ' Canopus ',
      destinationStation: 'Fisher Ring',
    },
  ])

  assert.equal(sides.get(rankStationKey('canopus', 'FISHER RING')), 'federal')
})

test('ранговое задание без цели станцию не помечает', () => {
  const sides = rankSidesByStation([{ name: 'Mission_Courier_RankEmp' }])

  assert.equal(sides.size, 0)
})

test('стороны считаются по взятым заданиям, цель не нужна', () => {
  const sides = activeRankSides([{ name: 'Mission_Courier_RankEmp' }, { name: 'Mission_Courier' }])

  assert.ok(sides.has('imperial'))
  assert.ok(!sides.has('federal'))
})

test('федеральное задание не гасит имперскую сотню', () => {
  const sides = activeRankSides([{ name: 'Mission_Delivery_RankFed' }])

  assert.ok(sides.has('federal'))
  assert.ok(!sides.has('imperial'))
})

test('пустой список — ни одной стороны', () => {
  assert.equal(activeRankSides([]).size, 0)
})
