import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ResultsPageSizeSection } from '@/views/account/ui/ResultsPageSizeSection'

const html = () => renderToStaticMarkup(React.createElement(ResultsPageSizeSection))

test('у списка подпись связана, а не подписана рядом', () => {
  const markup = html()
  const forId = /<label for="([^"]+)"/.exec(markup)

  assert.ok(forId, 'у списка обязана быть связанная подпись')
  assert.match(markup, new RegExp(`<select id="${forId[1]}"`))
})

test('пояснение связано со списком', () => {
  const markup = html()
  const describedBy = /<select[^>]*aria-describedby="([^"]+)"/.exec(markup)

  assert.ok(describedBy, 'у списка обязано быть описание')
  assert.match(markup, new RegExp(`id="${describedBy[1]}"`))
})

test('цель нажатия не меньше 44 пикселей (WCAG 2.5.8)', () => {
  assert.match(html(), /min-h-11/)
})
