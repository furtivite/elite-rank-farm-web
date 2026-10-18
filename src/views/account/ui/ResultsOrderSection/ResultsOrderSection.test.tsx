import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ResultsOrderSection } from '@/views/account/ui/ResultsOrderSection'

const html = () => renderToStaticMarkup(React.createElement(ResultsOrderSection))

test('это нативные радио-кнопки, а не кнопки с role="radio"', () => {
  const markup = html()

  assert.equal((markup.match(/type="radio"/g) ?? []).length, 2)
  assert.doesNotMatch(markup, /role="radio/)
})

test('обе кнопки — одна группа: общее имя поля', () => {
  const markup = html()
  const names = [...markup.matchAll(/name="([^"]+)"/g)].map((match) => match[1])

  assert.equal(names.length, 2)
  assert.equal(names[0], names[1])
})

test('имя группы — видимый заголовок в legend, а не свой aria-label', () => {
  const markup = html()

  assert.match(markup, /<legend[^>]*>Search result order<\/legend>/)
  assert.doesNotMatch(markup, /<fieldset[^>]*aria-label="/)
})

test('пояснение связано с группой, а не просто лежит рядом', () => {
  const markup = html()
  const describedBy = /<fieldset[^>]*aria-describedby="([^"]+)"/.exec(markup)

  assert.ok(describedBy, 'у группы обязано быть описание')
  assert.match(markup, new RegExp(`id="${describedBy[1]}"`))
})

test('группа обведена рамкой и по ширине содержимого', () => {
  const markup = html()
  const fieldset = /<fieldset[^>]*class="([^"]+)"/.exec(markup)

  assert.ok(fieldset, 'группа обязана быть fieldset')
  assert.match(fieldset[1], /border/)
  assert.match(fieldset[1], /w-fit/)
})

test('цель нажатия не меньше 44 пикселей (WCAG 2.5.8)', () => {
  const markup = html()

  assert.equal((markup.match(/min-h-11/g) ?? []).length, 2)
})
