import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import { rememberCommander } from '@/shared/lib/lastCommander'
import { CommanderHeading } from '@/widgets/app-shell/ui/CommanderHeading'

function commanderWith(name: string | null): UseCommanderStateResult {
  return {
    status: name === null ? 'not-found' : 'success',
    data: name === null ? null : { state: { commanderName: name } },
    progress: null,
    errorMessage: null,
  } as unknown as UseCommanderStateResult
}

async function headingText(commander: UseCommanderStateResult): Promise<string | undefined> {
  const view = await renderInDom(React.createElement(CommanderHeading, { commander }))
  const text = view.container.querySelector('h2')?.textContent ?? undefined
  view.unmount()
  return text
}

test('имя из текущего состояния', async () => {
  rememberCommander('OLD CMDR')

  assert.equal(await headingText(commanderWith('Jameson')), 'Commander Jameson')
})

test('агент молчит — последнее запомненное имя', async () => {
  rememberCommander('Jameson')

  assert.equal(await headingText(commanderWith(null)), 'Commander Jameson')
})

test('имени не было никогда — просто «Commander»', async () => {
  rememberCommander(null)

  assert.equal(await headingText(commanderWith(null)), 'Commander')
})
