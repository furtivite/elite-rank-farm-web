import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  _resetDemoSandboxForTests,
  createDemoCopy,
  setDemoSandboxActive,
} from '@/shared/lib/demoSandbox'

beforeEach(() => {
  _resetDemoSandboxForTests()
})

test('без показа читается настоящее, а запись идёт в хранилище', () => {
  const copy = createDemoCopy<string>(() => {})

  assert.equal(copy.read('настоящее'), 'настоящее')
  assert.equal(copy.write('новое'), false)
})

test('во время показа запись уходит в копию, а не в хранилище', () => {
  const copy = createDemoCopy<string>(() => {})
  setDemoSandboxActive(true)

  assert.equal(copy.read('настоящее'), 'настоящее')
  assert.equal(copy.write('нажато в показе'), true)
  assert.equal(copy.read('настоящее'), 'нажато в показе')
})

test('показ кончился — копия выброшена, видно настоящее', () => {
  const copy = createDemoCopy<string>(() => {})
  setDemoSandboxActive(true)
  copy.write('нажато в показе')
  setDemoSandboxActive(false)

  assert.equal(copy.read('настоящее'), 'настоящее')
})

test('следующий показ начинается с настоящего, а не с прошлой копии', () => {
  const copy = createDemoCopy<string>(() => {})
  setDemoSandboxActive(true)
  copy.write('нажато в прошлом показе')
  setDemoSandboxActive(false)
  setDemoSandboxActive(true)

  assert.equal(copy.read('настоящее'), 'настоящее')
})

test('начало и конец показа будят подписчиков хранилища', () => {
  let calls = 0
  createDemoCopy<string>(() => {
    calls += 1
  })

  setDemoSandboxActive(true)
  setDemoSandboxActive(false)

  assert.equal(calls, 2)
})
