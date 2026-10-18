import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JumpMultiplierSection } from '@/views/account/ui/JumpMultiplierSection'

const html = (jumpRangeLy: number | null) =>
  renderToStaticMarkup(React.createElement(JumpMultiplierSection, { jumpRangeLy }))

test('пять вариантов, и это нативные радио-кнопки', () => {
  const markup = html(39.83)

  assert.equal((markup.match(/type="radio"/g) ?? []).length, 5)
  assert.doesNotMatch(markup, /role="radio/)

  const names = [...markup.matchAll(/name="([^"]+)"/g)].map((match) => match[1])
  assert.equal(names.length, 5)
  assert.equal(new Set(names).size, 1, 'все пять — одна группа')
})

test('имя группы — видимый заголовок в legend, а не свой aria-label', () => {
  const markup = html(39.83)

  assert.match(markup, /<legend[^>]*>Search area<\/legend>/)
  assert.doesNotMatch(markup, /<fieldset[^>]*aria-label="/)
})

test('группа обведена рамкой и по ширине содержимого', () => {
  const fieldset = /<fieldset[^>]*class="([^"]+)"/.exec(html(39.83))

  assert.ok(fieldset, 'группа обязана быть fieldset')
  assert.match(fieldset[1], /border/)
  assert.match(fieldset[1], /w-fit/)
})

test('пояснение связано с группой и говорит, что это не прыжки', () => {
  const markup = html(39.83)
  const describedBy = /<fieldset[^>]*aria-describedby="([^"]+)"/.exec(markup)

  assert.ok(describedBy, 'у группы обязано быть описание')
  assert.match(markup, new RegExp(`id="${describedBy[1]}"`))
  assert.match(markup, /not a jump count/)
})

test('у каждого варианта подписаны его световые годы', () => {
  const markup = html(39.83)

  assert.match(markup, /40\u00a0ly/)
  assert.match(markup, /199\u00a0ly/)
})

test('без известной дальности световые годы не выдумываются', () => {
  const markup = html(null)

  assert.doesNotMatch(markup, /\u00a0ly/)
  assert.match(markup, /jump range is not known/)
})
