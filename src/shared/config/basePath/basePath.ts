const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const BASE_PATH = normalizeBasePath(RAW_BASE_PATH)

export function normalizeBasePath(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '/') {
    return ''
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash
}

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}
