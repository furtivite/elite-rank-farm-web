export const GOOGLE_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MwghtRxJ'

export function recaptchaSiteKey(): string {
  return (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '').trim()
}

export function isRecaptchaConfigured(): boolean {
  return recaptchaSiteKey() !== ''
}

export function isGoogleTestSiteKey(key: string = recaptchaSiteKey()): boolean {
  return key.trim() === GOOGLE_TEST_SITE_KEY
}
