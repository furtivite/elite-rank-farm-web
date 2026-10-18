import { JSDOM } from 'jsdom'

export const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.test/',
  pretendToBeVisual: true,
})

function define(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

for (const name of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Node',
  'Event',
  'MouseEvent',
  'getComputedStyle',
] as const) {
  define(name, (dom.window as unknown as Record<string, unknown>)[name])
}

define('IS_REACT_ACT_ENVIRONMENT', true)

define('BroadcastChannel', undefined)

define('self', dom.window)
if (typeof dom.window.matchMedia !== 'function') {
  define('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
  Object.defineProperty(dom.window, 'matchMedia', {
    value: globalThis.matchMedia,
    configurable: true,
    writable: true,
  })
}
