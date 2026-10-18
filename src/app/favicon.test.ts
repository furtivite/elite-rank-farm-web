import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const svg = readFileSync('public/favicon.svg', 'utf-8')

test('в значке две версии рисунка', () => {
  assert.equal((svg.match(/<image /g) ?? []).length, 2)
  assert.match(svg, /class="on-light"/)
  assert.match(svg, /class="on-dark"/)
})

test('переключает их медиазапрос внутри файла', () => {
  assert.match(svg, /@media \(prefers-color-scheme: dark\)/)
  assert.match(svg, /\.on-dark \{ display: none; \}/)
})

test('значок остаётся лёгким — это вкладка, а не картинка страницы', () => {
  assert.ok(svg.length < 32 * 1024, `значок вырос до ${Math.round(svg.length / 1024)} КБ`)
})
