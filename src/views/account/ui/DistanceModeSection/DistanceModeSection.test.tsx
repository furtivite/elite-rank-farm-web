import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DistanceModeSection } from '@/views/account/ui/DistanceModeSection'

const html = () => renderToStaticMarkup(React.createElement(DistanceModeSection))

test('это нативные радио-кнопки одной группы', () => {
  const markup = html()

  assert.equal((markup.match(/type="radio"/g) ?? []).length, 2)
  assert.doesNotMatch(markup, /role="radio/)

  const names = [...markup.matchAll(/name="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(names).size, 1)
})

test('умолчание — прямое расстояние, решение пользователя', () => {
  const markup = html()
  const checked = /<input[^>]*checked=""[^>]*\/?>/.exec(markup)

  assert.ok(checked, 'один вариант обязан быть выбран')
  assert.match(checked[0], /value="straight"/)
})

test('подпись группы — видимый заголовок в legend', () => {
  assert.match(html(), /<legend[^>]*>How to measure the way<\/legend>/)
})

test('пояснение связано с группой и говорит про нижнюю границу', () => {
  const markup = html()
  const describedBy = /<fieldset[^>]*aria-describedby="([^"]+)"/.exec(markup)

  assert.ok(describedBy, 'у группы обязано быть описание')
  assert.match(markup, new RegExp(`id="${describedBy[1]}"`))
  assert.match(markup, /lower bound/)
})
