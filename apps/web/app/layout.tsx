import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inktide — AI Streaming Platform',
  description: 'AI-powered streaming platform with reactive VRM avatars',

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[var(--bg-dark)] text-[var(--text-primary)] antialiased">
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
