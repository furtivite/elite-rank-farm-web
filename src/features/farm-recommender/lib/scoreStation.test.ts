import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import type { CachedStation } from '@/entities/galaxy-data'
import { scoreStation } from '@/features/farm-recommender/lib/scoreStation'

const en = createTranslate('en')

function makeStation(overrides: Partial<CachedStation> = {}): CachedStation {
  return {
    id: 'station-1',
    systemId: 'system-1',
    name: 'Test Station',
    missionProviderFactions: { status: 'unknown' },
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

test('scoreStation: близкий DTA даёт больше очков, чем далёкий', () => {
  const near = scoreStation({
    t: en,
    station: makeStation({ distanceToArrivalLs: 100 }),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
  })
  const far = scoreStation({
    t: en,
    station: makeStation({ distanceToArrivalLs: 50000 }),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
  })

  assert.ok(near.score > far.score)
})

test('scoreStation: неизвестная DTA нейтральна (0), а не штраф', () => {
  const unknown = scoreStation({
    t: en,
    station: makeStation({ distanceToArrivalLs: undefined }),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
  })

  assert.equal(unknown.score, 0)
  assert.ok(
    unknown.reasons.some((r) => r.label === 'distance from arrival unknown' && r.delta === 0),
  )
})

test('scoreStation: Good farm повышает, Bad farm понижает score (13.1)', () => {
  const base = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
  })
  const good = scoreStation({
    t: en,
    station: makeStation(),
    rating: 'good',
    missionCount: 0,
    systemMissionCount: 0,
  })
  const bad = scoreStation({
    t: en,
    station: makeStation(),
    rating: 'bad',
    missionCount: 0,
    systemMissionCount: 0,
  })

  assert.ok(good.score > base.score)
  assert.ok(bad.score < base.score)
})

test('scoreStation: сохранённые миссии дают бонус, но с потолком', () => {
  const one = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 1,
    systemMissionCount: 1,
  })
  const many = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 100,
    systemMissionCount: 100,
  })

  assert.ok(one.score > 0)
  assert.ok(many.score < 1000, 'бонус за миссии должен быть ограничен потолком')
})

test('scoreStation: faction count НИКОГДА не влияет на score (13.3 — station-level всегда unknown)', () => {
  const result = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
  })
  assert.ok(
    !result.reasons.some((r) => /faction/i.test(r.label) || /imperial|federal/i.test(r.label)),
  )
})

const NOW = new Date('2026-09-03T12:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY).toISOString()
}

test('устаревшие данные немного снижают score и объясняют почему (30)', () => {
  const fresh = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
    systemUpdatedAt: daysAgo(10),
    now: NOW,
  })
  const stale = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
    systemUpdatedAt: daysAgo(200),
    now: NOW,
  })

  assert.equal(stale.score, fresh.score - 3)
  assert.ok(stale.reasons.some((reason) => reason.label === 'data is out of date'))
  assert.ok(!fresh.reasons.some((reason) => reason.label === 'data is out of date'))
})

test('неизвестный возраст данных не штрафуется (30)', () => {
  const unknown = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
    systemUpdatedAt: undefined,
    now: NOW,
  })

  assert.ok(!unknown.reasons.some((reason) => reason.label === 'data is out of date'))
})

test('без «сейчас» свежесть не считается: скоринг остаётся чистым', () => {
  const withoutNow = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
    systemUpdatedAt: daysAgo(500),
  })

  assert.ok(!withoutNow.reasons.some((reason) => reason.label === 'data is out of date'))
})

test('штраф за возраст не перебивает оценку пользователя', () => {
  const goodStale = scoreStation({
    t: en,
    station: makeStation(),
    rating: 'good',
    missionCount: 0,
    systemMissionCount: 0,
    systemUpdatedAt: daysAgo(400),
    now: NOW,
  })
  const neutralFresh = scoreStation({
    t: en,
    station: makeStation(),
    rating: undefined,
    missionCount: 0,
    systemMissionCount: 0,
    systemUpdatedAt: daysAgo(1),
    now: NOW,
  })

  assert.ok(goodStale.score > neutralFresh.score)
})

const empire = { name: 'Aitvas Corp.', allegiance: 'Empire' } as const
const independent = { name: 'Brothers of Mainani', allegiance: 'Independent' } as const

test('scoreStation: станция под своей стороной получает надбавку (11)', () => {
  const base = { rating: undefined, missionCount: 0, systemMissionCount: 0 } as const
  const own = scoreStation({
    t: en,
    station: makeStation({ controllingFaction: empire }),
    ...base,
    farmMode: 'empire',
  })
  const foreign = scoreStation({
    t: en,
    station: makeStation({ controllingFaction: independent }),
    ...base,
    farmMode: 'empire',
  })
  const unknownOwner = scoreStation({ t: en, station: makeStation(), ...base, farmMode: 'empire' })

  assert.ok(own.score > foreign.score)
  assert.equal(foreign.score, unknownOwner.score)
  assert.ok(own.reasons.some((r) => r.label === 'Empire-controlled station' && r.delta > 0))
})

test('scoreStation: надбавка идёт той стороне, чей ранг фармят', () => {
  const base = { rating: undefined, missionCount: 0, systemMissionCount: 0 } as const
  const inFederal = scoreStation({
    t: en,
    station: makeStation({ controllingFaction: empire }),
    ...base,
    farmMode: 'federal',
  })
  const inEmpire = scoreStation({
    t: en,
    station: makeStation({ controllingFaction: empire }),
    ...base,
    farmMode: 'empire',
  })

  assert.ok(inEmpire.score > inFederal.score)
})

test('scoreStation: без режима владелец на score не влияет', () => {
  const base = { rating: undefined, missionCount: 0, systemMissionCount: 0 } as const
  const withOwner = scoreStation({
    t: en,
    station: makeStation({ controllingFaction: empire }),
    ...base,
  })
  const without = scoreStation({ t: en, station: makeStation(), ...base })

  assert.equal(withOwner.score, without.score)
})

test('scoreStation: ступени суперкруиза различают ближние станции (43.5)', () => {
  const base = { rating: undefined, missionCount: 0, systemMissionCount: 0 } as const
  const atStar = scoreStation({ t: en, station: makeStation({ distanceToArrivalLs: 6 }), ...base })
  const nearby = scoreStation({
    t: en,
    station: makeStation({ distanceToArrivalLs: 490 }),
    ...base,
  })

  assert.ok(atStar.score > nearby.score)
})

test('scoreStation: крупный порт выигрывает у аванпоста той же дальности (43.5)', () => {
  const base = { rating: undefined, missionCount: 0, systemMissionCount: 0 } as const
  const port = scoreStation({
    t: en,
    station: makeStation({ type: 'Coriolis Starport', distanceToArrivalLs: 300 }),
    ...base,
  })
  const outpost = scoreStation({
    t: en,
    station: makeStation({ type: 'Outpost', distanceToArrivalLs: 300 }),
    ...base,
  })

  assert.ok(port.score > outpost.score)
  assert.ok(port.reasons.some((r) => r.label === 'large port'))
})

test('scoreStation: поверхность не штрафуется (13.1)', () => {
  const base = { rating: undefined, missionCount: 0, systemMissionCount: 0 } as const
  const settlement = scoreStation({
    t: en,
    station: makeStation({ type: 'Settlement', distanceToArrivalLs: 300 }),
    ...base,
  })
  const outpost = scoreStation({
    t: en,
    station: makeStation({ type: 'Outpost', distanceToArrivalLs: 300 }),
    ...base,
  })

  assert.equal(settlement.score, outpost.score)
})
