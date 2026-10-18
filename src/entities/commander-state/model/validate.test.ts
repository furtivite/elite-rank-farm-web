import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCommanderStateResponse } from '@/entities/commander-state/model/validate'

const valid = {
  status: 'ok',
  state: {
    schemaVersion: 4,
    commanderName: 'Jameson',
    currentSystem: { name: 'Mainani', x: 10.40625, y: -219.8125, z: -64.21875 },
    currentStation: "Mies van der Rohe's Claim",
    currentBody: null,
    ship: 'diamondbackxl',
    requiredPadSize: null,
    jumpRangeLy: 43.49,
    imperialRank: 7,
    imperialProgress: 71,
    imperialProgressAt: '2026-09-01T18:04:02Z',
    federalRank: 2,
    federalProgress: 100,
    federalProgressAt: '2026-09-01T18:04:02Z',
    observedAt: '2026-09-01T22:16:09Z',
  },
  updatedAt: '2026-09-02T07:22:13Z',
}

test('разбирает ответ сервера по контракту', () => {
  const parsed = parseCommanderStateResponse(valid)

  assert.ok(parsed)
  assert.equal(parsed.state.commanderName, 'Jameson')
  assert.equal(parsed.state.currentSystem.x, 10.40625)
  assert.equal(parsed.state.currentStation, "Mies van der Rohe's Claim")
  assert.equal(parsed.state.imperialProgressAt, '2026-09-01T18:04:02Z')
  assert.equal(parsed.updatedAt, '2026-09-02T07:22:13Z')
})

test('отклоняет чужую или повреждённую форму ответа', () => {
  assert.equal(parseCommanderStateResponse(null), null)
  assert.equal(parseCommanderStateResponse('строка'), null)
  assert.equal(parseCommanderStateResponse({}), null)
  assert.equal(parseCommanderStateResponse({ ...valid, status: 'error' }), null)
  assert.equal(parseCommanderStateResponse({ ...valid, updatedAt: 42 }), null)
})

test('отклоняет другую версию схемы', () => {
  const other = { ...valid, state: { ...valid.state, schemaVersion: 2 } }
  assert.equal(parseCommanderStateResponse(other), null)
})

test('отклоняет состояние без времени прогресса', () => {
  const { imperialProgressAt: _omitted, ...withoutProgressAt } = valid.state
  assert.equal(parseCommanderStateResponse({ ...valid, state: withoutProgressAt }), null)
})

test('отклоняет координаты, которые нельзя использовать в поиске', () => {
  const asString = {
    ...valid,
    state: { ...valid.state, currentSystem: { ...valid.state.currentSystem, x: '10.4' } },
  }
  assert.equal(parseCommanderStateResponse(asString), null)

  const notFinite = {
    ...valid,
    state: { ...valid.state, currentSystem: { ...valid.state.currentSystem, y: Number.NaN } },
  }
  assert.equal(parseCommanderStateResponse(notFinite), null)
})

test('принимает пустые необязательные поля и известные размеры пада', () => {
  const docked = {
    ...valid,
    state: { ...valid.state, currentStation: null, currentBody: 'Mainani', requiredPadSize: 'L' },
  }
  const parsed = parseCommanderStateResponse(docked)

  assert.ok(parsed)
  assert.equal(parsed.state.currentStation, null)
  assert.equal(parsed.state.requiredPadSize, 'L')

  const unknownPad = { ...valid, state: { ...valid.state, requiredPadSize: 'XL' } }
  assert.equal(parseCommanderStateResponse(unknownPad), null)
})

test('presence из ответа разбирается', () => {
  const parsed = parseCommanderStateResponse({
    ...valid,
    state: {
      ...valid.state,
      presence: { status: 'gameExited', at: '2026-09-06T21:40:00Z' },
    },
  })

  assert.equal(parsed?.state.presence?.status, 'gameExited')
  assert.equal(parsed?.state.presence?.at, '2026-09-06T21:40:00Z')
})

test('состояние без presence разбирается — это законное «сигнала не было»', () => {
  const parsed = parseCommanderStateResponse(valid)

  assert.ok(parsed !== null)
  assert.equal(parsed?.state.presence, undefined)
})

test('негодный presence не роняет всё состояние', () => {
  const parsed = parseCommanderStateResponse({
    ...valid,
    state: { ...valid.state, presence: { status: 'paused', at: '2026-09-06T21:40:00Z' } },
  })

  assert.ok(parsed !== null)
  assert.equal(parsed?.state.presence, undefined)
  assert.equal(parsed?.state.commanderName, valid.state.commanderName)
})

test('loadout переносится целиком', () => {
  const parsed = parseCommanderStateResponse({
    ...valid,
    state: {
      ...valid.state,
      loadout: {
        unladenMassT: 1256.199951,
        fuelCapacityT: 64,
        cargoCapacityT: 724,
        fuelLevelT: 42.8,
        cargoT: 300,
        fsdSymbol: 'int_hyperdrive_overcharge_size6_class5',
        fsdOptimalMassT: 3224,
        fsdBoosterSymbol: 'int_guardianfsdbooster_size4',
      },
    },
  })

  assert.ok(parsed)
  assert.equal(parsed.state.loadout?.unladenMassT, 1256.199951)
  assert.equal(parsed.state.loadout?.cargoT, 300)
  assert.equal(parsed.state.loadout?.fsdSymbol, 'int_hyperdrive_overcharge_size6_class5')
  assert.equal(parsed.state.loadout?.fsdBoosterSymbol, 'int_guardianfsdbooster_size4')
})

test('половина сведений лучше, чем ничего', () => {
  const parsed = parseCommanderStateResponse({
    ...valid,
    state: {
      ...valid.state,
      loadout: { unladenMassT: 1256.2, fuelCapacityT: 64 },
    },
    updatedAt: '2026-09-08T12:00:00Z',
  })

  assert.ok(parsed)
  assert.equal(parsed.state.loadout?.fuelLevelT, undefined)
  assert.equal(parsed.state.loadout?.cargoT, undefined)
})

test('негодная сборка не роняет состояние целиком', () => {
  const parsed = parseCommanderStateResponse({
    ...valid,
    state: { ...valid.state, loadout: { unladenMassT: 'много' } },
  })

  assert.ok(parsed)
  assert.equal(parsed.state.loadout, undefined)
  assert.equal(parsed.state.commanderName, valid.state.commanderName)
})
