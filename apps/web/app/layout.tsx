import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/shared/ui/theme-provider'
import { Providers } from './_providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Inktide — AI Streaming Platform',
    template: '%s — Inktide',
  },
  description: 'AI-powered streaming platform with reactive VRM avatars',
  other: {
    enot: 'd1ef7c50',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={GeistSans.variable}>
      <body suppressHydrationWarning className="bg-[var(--bg-0)] text-[var(--text-primary)] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
