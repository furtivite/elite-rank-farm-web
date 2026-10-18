import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  GOOGLE_TEST_SITE_KEY,
  isGoogleTestSiteKey,
  isRecaptchaConfigured,
  recaptchaSiteKey,
} from '@/shared/config/recaptcha'

const REAL = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

afterEach(() => {
  if (REAL === undefined) {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  } else {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = REAL
  }
})

test('без ключа капча не настроена', () => {
  delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  assert.equal(recaptchaSiteKey(), '')
  assert.equal(isRecaptchaConfigured(), false)
})

test('пробелы вокруг ключа не делают его настроенным', () => {
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '   '
  assert.equal(isRecaptchaConfigured(), false)
})

test('заданный ключ читается без краевых пробелов', () => {
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '  6LcRealKeyExample  '
  assert.equal(recaptchaSiteKey(), '6LcRealKeyExample')
  assert.equal(isRecaptchaConfigured(), true)
})

test('тестовый ключ Google узнаётся', () => {
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = GOOGLE_TEST_SITE_KEY
  assert.equal(isGoogleTestSiteKey(), true, 'он пропускает любого — на бою это форма без защиты')
})

test('похожий ключ тестовым не считается', () => {
  assert.equal(isGoogleTestSiteKey(GOOGLE_TEST_SITE_KEY.slice(0, -1)), false)
  assert.equal(isGoogleTestSiteKey('6LcRealKeyExample'), false)
})
