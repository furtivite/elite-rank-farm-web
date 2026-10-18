import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { withBasePath } from '@/shared/config/basePath'
import { LANGUAGE_BOOT_SCRIPT, DEFAULT_LANGUAGE } from '@/shared/lib/i18n'
import { SIGNED_IN_BOOT_SCRIPT } from '@/shared/lib/session'
import { THEME_BOOT_SCRIPT } from '@/shared/lib/theme/bootScript'
import { ThemeProvider } from '@/shared/lib/theme/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Elite',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: withBasePath('/favicon.svg'), type: 'image/svg+xml' },
      {
        url: withBasePath('/icons/dark/favicon-32x32.png'),
        type: 'image/png',
        sizes: '32x32',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: withBasePath('/icons/dark/favicon-16x16.png'),
        type: 'image/png',
        sizes: '16x16',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: withBasePath('/icons/light/favicon-32x32.png'),
        type: 'image/png',
        sizes: '32x32',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: withBasePath('/icons/light/favicon-16x16.png'),
        type: 'image/png',
        sizes: '16x16',
        media: '(prefers-color-scheme: light)',
      },
    ],
    shortcut: [{ url: withBasePath('/icons/light/favicon.ico') }],
    apple: [{ url: withBasePath('/icons/light/favicon-180x180.png'), sizes: '180x180' }],
  },
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={DEFAULT_LANGUAGE} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANGUAGE_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SIGNED_IN_BOOT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
