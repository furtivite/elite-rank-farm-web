import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuestLanding } from '@/views/home/ui/GuestLanding'

const html = () => renderToStaticMarkup(React.createElement(GuestLanding))

test('станция — две картинки, по одной на тему', () => {
  const markup = html()

  assert.match(markup, /station_black\.png/)
  assert.match(markup, /station_white\.png/)
  assert.match(markup, /station_black\.png"[^>]*class="[^"]*dark:hidden/)
  assert.match(
    markup,
    /class="hidden[^"]*dark:block[^"]*"[^>]*src="[^"]*station_white|station_white\.png"[^>]*class="hidden[^"]*dark:block/,
  )
})

test('пропорции держит файл, а не вёрстка', () => {
  const markup = html()

  assert.match(markup, /width="1254"/)
  assert.match(markup, /height="1254"/)
  assert.match(markup, /h-auto/)
})

test('картинка декоративна: смысл несёт текст (WCAG 1.1.1)', () => {
  assert.equal((html().match(/alt=""/g) ?? []).length, 2)
})

test('заголовок — h1 и говорит про пустоту космоса', () => {
  const markup = html()

  assert.match(markup, /<h1[^>]*>[\s\S]*Space is mostly empty[\s\S]*<\/h1>/)
  assert.match(markup, /<h1[^>]*class="[^"]*text-base/)
})

test('ссылка «поехали» подчёркнута и ведёт на вход', () => {
  const markup = html()
  const link = /<a [^>]*>[\s\S]*?<\/a>/.exec(markup)

  assert.ok(link, 'ссылка обязана быть ссылкой, а не кнопкой')
  assert.match(link[0], /Let&#x27;s go!/)
  assert.match(link[0], /Поехали!/)
  assert.match(link[0], /underline/)
  assert.match(link[0], /href="[^"]*\/account\//)
})

test('цель нажатия не меньше 44 пикселей (WCAG 2.5.8)', () => {
  const markup = html()

  assert.ok((markup.match(/min-h-11/g) ?? []).length >= 4)
})

test('выбранный язык отмечен не только цветом (WCAG 1.4.1)', () => {
  const markup = html()

  assert.match(markup, /aria-pressed="true"/)
  assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 1, 'выбран ровно один')
  assert.match(markup, /aria-hidden="true"[^>]*class="[^"]*rounded-full/)
})

test('подписи языков — RU и US, обычным начертанием', () => {
  const markup = html()

  assert.match(markup, />RU</)
  assert.match(markup, />US</)
  assert.doesNotMatch(markup, /font-bold|font-semibold/)
})

test('в подвале только строка про хранение языка, и она правдива', () => {
  const markup = html()

  assert.match(markup, /About browser storage/)
  assert.match(markup, /stores only your chosen language/)
  assert.doesNotMatch(markup, /missions|ratings|clusters/i)
})

test('экран помечен как гостевой — иначе вошедший видит его после F5 (110)', () => {
  assert.match(html(), /data-guest-only/)
})

test('обе языковые версии лежат в разметке, лишнюю прячет браузер (110)', () => {
  const markup = html()

  assert.match(markup, /Space is mostly empty/)
  assert.match(markup, /В космосе, преимущественно, пусто/)
  assert.match(markup, /Поехали!/)
  assert.match(markup, /Let&#x27;s go!/)
})

test('у каждой версии свой lang — иначе чужой голос у скринридера (WCAG 3.1.2)', () => {
  const markup = html()

  assert.match(markup, /<span lang="ru" data-lang="ru">/)
  assert.match(markup, /<span lang="en" data-lang="en">/)
})
