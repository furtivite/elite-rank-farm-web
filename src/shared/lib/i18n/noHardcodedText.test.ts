import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const SRC = path.join(process.cwd(), 'src')

const LOOKS_LIKE_TEXT = /[A-Za-zА-Яа-яЁё]{2,}/

const LOOKS_LIKE_CODE = /[=;()[\]'"`|]|=>|\.\w/

const ALLOWED: ReadonlyArray<{ file: string; why: string }> = [
  {
    file: 'views/home/ui/GuestLanding/GuestLanding.tsx',
    why: 'обе версии строки сразу — решение 110',
  },
]

function walk(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      found.push(...walk(full))
      continue
    }
    if (full.includes(`${path.sep}test${path.sep}`)) {
      continue
    }
    if (entry.endsWith('.tsx') && !entry.includes('.test.')) {
      found.push(full)
    }
  }
  return found
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('в разметке нет текста мимо словаря (92.3)', () => {
  const offenders: string[] = []

  for (const file of walk(SRC)) {
    const relative = path.relative(SRC, file).split(path.sep).join('/')
    if (ALLOWED.some((entry) => entry.file === relative)) {
      continue
    }

    const source = withoutComments(readFileSync(file, 'utf-8'))

    for (const match of source.matchAll(/>([^<>{}\n]+)</g)) {
      const text = match[1]?.trim() ?? ''
      if (text === '' || !LOOKS_LIKE_TEXT.test(text) || LOOKS_LIKE_CODE.test(text)) {
        continue
      }

      offenders.push(`${relative}: «${text.slice(0, 60)}»`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    'Текст в разметке показывается на языке сборки, а не на выбранном. ' +
      'Либо в словарь и через t(), либо в список исключений с причиной.',
  )
})

test('список исключений не растёт молча', () => {
  assert.ok(ALLOWED.length <= 3, `исключений ${ALLOWED.length}, пора разбираться`)

  for (const entry of ALLOWED) {
    assert.ok(entry.why.length > 10, `исключению ${entry.file} нужна причина словами`)
  }
})
