import { currentTranslate } from '@/shared/lib/i18n'

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return currentTranslate()('error.galaxyDataFailed')
}

export async function fetchJson<T>(url: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(url)
  } catch (error) {
    throw new Error(
      `${currentTranslate()('error.requestFailed')} ${url}: ${errorMessageFromUnknown(error)}`,
      { cause: error },
    )
  }

  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}
