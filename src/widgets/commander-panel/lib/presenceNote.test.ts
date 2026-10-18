import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import { PRESENCE_STALE_AFTER_MS } from '@/entities/commander-state'
import { presenceNote } from '@/widgets/commander-panel/lib/presenceNote'

const t = createTranslate('en')
const NOW = Date.parse('2026-09-09T18:00:00Z')

function stored(minutesAgo: number): string {
  return new Date(NOW - minutesAgo * 60 * 1000).toISOString()
}

test('свежий сигнал говорит о происходящем', () => {
  const note = presenceNote({ status: 'playing', at: '2026-09-09T17:55:00Z' }, t, stored(5), NOW)

  assert.match(note ?? '', /game running/i)
})

test('после часа молчания «игра закрыта» превращается в «не выходил на связь»', () => {
  const note = presenceNote(
    { status: 'gameExited', at: '2026-09-09T14:30:00Z' },
    t,
    stored(210),
    NOW,
  )

  assert.match(note ?? '', /has not checked in/)
  assert.doesNotMatch(
    note ?? '',
    /game closed/i,
    'о закрытой игре мы через три часа не знаем ничего',
  )
})

test('«игра идёт» тоже стареет', () => {
  const note = presenceNote({ status: 'playing', at: '2026-09-09T14:30:00Z' }, t, stored(210), NOW)

  assert.match(note ?? '', /has not checked in/)
})

test('на самом пороге сигнал уже считается устаревшим', () => {
  const note = presenceNote(
    { status: 'playing', at: '2026-09-09T17:00:00Z' },
    t,
    new Date(NOW - PRESENCE_STALE_AFTER_MS).toISOString(),
    NOW,
  )

  assert.match(note ?? '', /has not checked in/)
})

test('за минуту до порога — прежняя строка', () => {
  const note = presenceNote({ status: 'playing', at: '2026-09-09T17:00:00Z' }, t, stored(59), NOW)

  assert.match(note ?? '', /game running/i)
})

test('без времени сервера возраст не выдумывается', () => {
  const note = presenceNote({ status: 'playing', at: '2026-09-09T17:55:00Z' }, t, undefined, NOW)

  assert.match(note ?? '', /game running/i)
})

test('нет сигнала — нет и строки', () => {
  assert.equal(presenceNote(undefined, t, stored(1), NOW), null)
})
