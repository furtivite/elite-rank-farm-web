import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { buttonByText, renderInDom } from '@/shared/test/renderInDom'
import {
  DEFAULT_OTHER_STARS_PAGE_SIZE,
  writeOtherStarsPageSize,
} from '@/shared/lib/otherStarsPageSize'
import { OtherStarsList } from '@/widgets/other-stars/ui/OtherStarsList/OtherStarsList'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  writeOtherStarsPageSize(DEFAULT_OTHER_STARS_PAGE_SIZE)
})

function mark(index: number) {
  return {
    stationId: String(1000 + index),
    stationName: `База ${index}`,
    systemName: `Система ${index}`,
    bodyName: null,
    distanceToArrivalLs: 1000 + index,
    markedBy: null,
    markedAt: null,
    fromDump: true,
    dumpStarName: `Звезда ${index}`,
  }
}

function serveMarks(count: number) {
  global.fetch = (async () =>
    new Response(
      JSON.stringify({ status: 'ok', marks: Array.from({ length: count }, (_, i) => mark(i)) }),
      {
        status: 200,
      },
    )) as typeof fetch
}

test('список приезжает из сети и рисуется', async () => {
  serveMarks(3)
  const view = await renderInDom(React.createElement(OtherStarsList))

  assert.match(view.html(), /База 0/)
  assert.match(view.html(), /External data: star Звезда 2/, 'причина из дампа показана')
  view.unmount()
})

test('показывается первый десяток, остальное — за кнопкой (107)', async () => {
  serveMarks(120)
  const view = await renderInDom(React.createElement(OtherStarsList))

  assert.match(view.html(), /База 9/)
  assert.doesNotMatch(view.html(), /База 10\b/, '11-я строка ждёт кнопки')
  assert.match(view.html(), /Showing 10 of 120/)
  view.unmount()
})

test('кнопка открывает следующий десяток', async () => {
  serveMarks(120)
  const view = await renderInDom(React.createElement(OtherStarsList))

  await view.click(buttonByText(view.container, 'Show'))

  assert.match(view.html(), /База 19/)
  assert.doesNotMatch(view.html(), /База 20\b/)
  assert.match(view.html(), /Showing 20 of 120/)
  view.unmount()
})

test('на последней порции кнопка исчезает', async () => {
  serveMarks(12)
  const view = await renderInDom(React.createElement(OtherStarsList))

  await view.click(buttonByText(view.container, 'Show'))

  assert.match(view.html(), /База 11/)
  assert.equal(buttonByText(view.container, 'Show'), null)
  view.unmount()
})

test('переключатель порции меняет длину списка (107)', async () => {
  serveMarks(120)
  const view = await renderInDom(React.createElement(OtherStarsList))

  await view.selectOption(view.container.querySelector('select'), '25')

  assert.match(view.html(), /База 24/)
  assert.doesNotMatch(view.html(), /База 25\b/)
  assert.match(view.html(), /Showing 25 of 120/)
  view.unmount()
})

test('уменьшение порции начинает список заново, а не оставляет открытое', async () => {
  serveMarks(120)
  const view = await renderInDom(React.createElement(OtherStarsList))

  await view.click(buttonByText(view.container, 'Show'))
  await view.click(buttonByText(view.container, 'Show'))
  assert.match(view.html(), /Showing 30 of 120/)

  await view.selectOption(view.container.querySelector('select'), '10')

  assert.match(view.html(), /Showing 10 of 120/)
  view.unmount()
})

test('переключатель виден и когда список кончился', async () => {
  serveMarks(3)
  const view = await renderInDom(React.createElement(OtherStarsList))

  assert.equal(buttonByText(view.container, 'Show'), null, 'кнопке нечего открывать')
  assert.notEqual(view.container.querySelector('select'), null)
  view.unmount()
})

test('гостю предлагают войти, а не показывают пустоту', async () => {
  global.fetch = (async () => new Response('', { status: 401 })) as typeof fetch
  const view = await renderInDom(React.createElement(OtherStarsList))

  assert.match(view.html(), /Sign in to see the list/)
  view.unmount()
})

test('упавший запрос говорит об этом, а не молчит', async () => {
  global.fetch = (async () => {
    throw new Error('сеть')
  }) as unknown as typeof fetch
  const view = await renderInDom(React.createElement(OtherStarsList))

  assert.match(view.html(), /The list did not load/)
  view.unmount()
})
