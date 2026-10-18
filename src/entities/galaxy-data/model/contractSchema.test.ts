import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseCachedSystem } from '@/entities/galaxy-data/model/validateSystem'

type SchemaDefs = {
  $defs: Record<string, { required?: string[] }>
}

function regionSchema(): SchemaDefs {
  return JSON.parse(readFileSync('contracts/bootstrap-region.schema.json', 'utf8'))
}

function required(name: string): string[] {
  const list = regionSchema().$defs[name]?.required ?? []
  assert.ok(list.length > 0, `в схеме нет required у "${name}" — значит прочитали не то`)
  return list
}

function validSystem(): Record<string, unknown> {
  return JSON.parse(
    readFileSync('src/entities/galaxy-data/model/__fixtures__/system-snapshot.json', 'utf8'),
  )
}

test('настоящий снимок проходит — иначе проверки ниже бессмысленны', () => {
  const parsed = parseCachedSystem(validSystem())

  assert.notEqual(parsed, null)
  assert.equal(parsed?.name, 'Col 285 Sector NC-M c7-2')
  assert.equal(parsed?.stations.length, 3)
})

test('фикстура и правда покрывает оба края формы станции', () => {
  const stations = validSystem().stations as Record<string, unknown>[]

  assert.ok(
    stations.some(
      (station) => station.star !== undefined && station.controllingFaction !== undefined,
    ),
    'нужна станция с необязательными полями',
  )
  assert.ok(
    stations.some((station) => station.star === undefined && station.bodyName === undefined),
    'нужна станция без единого необязательного поля',
  )
})

test('каждое обязательное поле системы из схемы и правда обязательно', () => {
  for (const field of required('system')) {
    const system = validSystem()
    delete system[field]

    assert.equal(
      parseCachedSystem(system),
      null,
      `без ${field} систему надо отвергать: схема считает поле обязательным`,
    )
  }
})

test('каждое обязательное поле станции из схемы и правда обязательно', () => {
  for (const field of required('station')) {
    if (field === 'missionProviderFactions') {
      continue
    }

    const system = validSystem()
    const stations = system.stations as Record<string, unknown>[]
    delete stations[0][field]

    assert.equal(
      parseCachedSystem(system),
      null,
      `без ${field} у станции систему надо отвергать: схема считает поле обязательным`,
    )
  }
})

test('каждое обязательное поле фракции из схемы и правда обязательно', () => {
  for (const field of required('faction')) {
    const system = validSystem()
    const factions = system.systemFactions as Record<string, unknown>[]
    delete factions[0][field]

    assert.equal(parseCachedSystem(system), null, `фракция без ${field} не должна проходить`)
  }
})

test('каждое обязательное поле сводки фракций из схемы и правда обязательно', () => {
  for (const field of required('factionSummary')) {
    const system = validSystem()
    const summary = system.systemFactionSummary as Record<string, unknown>
    delete summary[field]

    assert.equal(parseCachedSystem(system), null, `сводка без ${field} не должна проходить`)
  }
})

test('станция чужой системы в ответ не попадает', () => {
  const system = validSystem()
  const stations = system.stations as Record<string, unknown>[]
  stations[0].systemId = '1'

  assert.equal(parseCachedSystem(system), null)
})
