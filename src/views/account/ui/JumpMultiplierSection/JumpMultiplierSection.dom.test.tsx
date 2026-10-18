import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { writeJumpMultiplier } from '@/shared/lib/searchRadius'
import { JumpMultiplierSection } from '@/views/account/ui/JumpMultiplierSection'

test('зажатая область названа вслух: просили одно, возьмём другое', async () => {
  writeJumpMultiplier(5)

  const { html } = await renderInDom(
    React.createElement(JumpMultiplierSection, {
      jumpRangeLy: 40,
    }),
  )

  assert.match(
    html(),
    /asks for 200 ly, but the search will take 150 ly/,
    'зажатие обязано быть названо словами, а не выведено читателем',
  )
})

test('когда зажимать нечего, лишней строки нет', async () => {
  writeJumpMultiplier(1)

  const { html } = await renderInDom(
    React.createElement(JumpMultiplierSection, {
      jumpRangeLy: 40,
    }),
  )

  assert.doesNotMatch(html(), /asks for|просит/)
})
