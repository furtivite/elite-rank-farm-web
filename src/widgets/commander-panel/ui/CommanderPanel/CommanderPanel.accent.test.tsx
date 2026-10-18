import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CommanderPanel } from '@/widgets/commander-panel'
import { commanderFromScenario } from '@/widgets/commander-panel/ui/CommanderPanel/commanderFixture'

function renderPanel({ farmMode }: { farmMode?: 'empire' | 'federal' }): string {
  return renderToStaticMarkup(
    React.createElement(CommanderPanel, {
      commander: commanderFromScenario('docked'),
      farmMode,
    }),
  )
}

test('звание стороны, под которую идёт фарм, помечено словом', () => {
  const imperial = renderPanel({ farmMode: 'empire' })
  const federal = renderPanel({ farmMode: 'federal' })

  assert.match(imperial, /Imperial Navy[\s\S]{0,400}farming this side/)
  assert.match(federal, /Federal Navy[\s\S]{0,400}farming this side/)
  assert.equal(imperial.match(/farming this side/g)?.length, 1)
})

test('без выбранной стороны не помечено ничего', () => {
  assert.doesNotMatch(renderPanel({}), /farming this side/)
})
