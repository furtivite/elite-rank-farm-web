import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const SRC = path.join(process.cwd(), 'src')

const INTERACTIVE = new Set([
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'summary',
  'Button',
  'Link',
  'Select',
  'StarMarkToggle',
])

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      return files(full)
    }
    return full.endsWith('.tsx') && !full.includes('.test.') ? [full] : []
  })
}

test('нажатие живёт на кнопке, а не на div (118)', () => {
  const offenders: string[] = []

  for (const file of files(SRC)) {
    const text = readFileSync(file, 'utf8')

    for (const match of text.matchAll(/onClick=/g)) {
      const before = text.slice(0, match.index)
      const tags = [...before.matchAll(/<([A-Za-z][\w.]*)/g)]
      const tag = tags.at(-1)?.[1] ?? '?'

      if (!INTERACTIVE.has(tag)) {
        offenders.push(`${path.relative(SRC, file)}:${before.split('\n').length} <${tag}>`)
      }
    }
  }

  assert.deepEqual(offenders, [])
})
