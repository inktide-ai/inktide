import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/shared/ui/theme-provider'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/i18n/i18n-provider'
import { getLocale, getTranslations } from '@/lib/i18n-server'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')
  return {
    title: {
      default: t('meta.title'),
      template: '%s — Quackie',
    },
    description: t('meta.description'),
    other: {
      enot: 'd1ef7c50',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLocale()
  return (
    <html lang={lang} suppressHydrationWarning data-scroll-behavior="smooth" className={GeistSans.variable}>
      <body suppressHydrationWarning className="bg-[var(--bg-0)] text-[var(--text-primary)] antialiased">
        <SessionProvider refetchOnWindowFocus={false}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            <I18nProvider lang={lang}>{children}</I18nProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
