import { dom } from './domEnvironment'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'

export type RenderedInDom = {
  container: HTMLElement
  html: () => string
  click: (element: Element | null) => Promise<void>
  settle: () => Promise<void>
  chooseFile: (input: Element | null, file: File) => Promise<void>
  selectOption: (select: Element | null, value: string) => Promise<void>
  type: (field: Element | null, text: string) => Promise<void>
  unmount: () => void
}

export async function renderInDom(element: ReactElement): Promise<RenderedInDom> {
  const container = dom.window.document.createElement('div')
  dom.window.document.body.append(container)

  let root: Root
  await act(async () => {
    root = createRoot(container)
    root.render(element)
  })

  const settle = async () => {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  await settle()

  return {
    container,
    html: () => container.innerHTML,
    click: async (target) => {
      if (target === null) {
        throw new Error('Кликать не по чему: элемент не найден.')
      }
      await act(async () => {
        target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
      })
      await settle()
    },
    settle,
    chooseFile: async (input: Element | null, file: File) => {
      if (input === null) {
        throw new Error('Поля для файла нет.')
      }
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      await act(async () => {
        input.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
      })
      await settle()
    },
    selectOption: async (select: Element | null, value: string) => {
      if (select === null) {
        throw new Error('Выпадающего списка нет.')
      }
      await act(async () => {
        ;(select as HTMLSelectElement).value = value
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
      })
      await settle()
    },
    type: async (field: Element | null, text: string) => {
      if (field === null) {
        throw new Error('Печатать некуда: поля не найдено.')
      }

      const input = field as HTMLInputElement | HTMLTextAreaElement

      await act(async () => {
        delete (input as unknown as Record<string, unknown>).value
        input.value = text
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
      })
      await settle()
    },
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

export function buttonByText(container: HTMLElement, text: string): Element | null {
  return (
    Array.from(container.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes(text),
    ) ?? null
  )
}
