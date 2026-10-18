import assert from 'node:assert/strict'
import { test } from 'node:test'
import { landingCheck, warnsAboutLanding } from '@/entities/mission-store/lib/landingWarning'

test('корабль садится на свою площадку и на любую большую (71)', () => {
  assert.equal(landingCheck('L', 'L'), 'fits')
  assert.equal(landingCheck('L', 'M'), 'fits')
  assert.equal(landingCheck('L', 'S'), 'fits')
  assert.equal(landingCheck('M', 'M'), 'fits')
  assert.equal(landingCheck('M', 'S'), 'fits')
  assert.equal(landingCheck('S', 'S'), 'fits')
})

test('площадка меньше корабля — предупреждение', () => {
  assert.equal(landingCheck('M', 'L'), 'too-small')
  assert.equal(landingCheck('S', 'L'), 'too-small')
  assert.equal(landingCheck('S', 'M'), 'too-small')
  assert.equal(warnsAboutLanding(landingCheck('M', 'L')), true)
})

test('неизвестный размер площадки предупреждения не даёт', () => {
  assert.equal(landingCheck(undefined, 'L'), 'unknown')
  assert.equal(warnsAboutLanding(landingCheck(undefined, 'L')), false)
})

test('неизвестный корабль предупреждения не даёт: сравнивать не с чем', () => {
  assert.equal(landingCheck('S', null), 'unknown')
  assert.equal(landingCheck('S', undefined), 'unknown')
})

test('предупреждение бывает только у too-small', () => {
  assert.equal(warnsAboutLanding('fits'), false)
  assert.equal(warnsAboutLanding('unknown'), false)
  assert.equal(warnsAboutLanding('too-small'), true)
})
