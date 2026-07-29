import type { NextConfig } from 'next'
import path from 'path'

// @tailwindcss/node resolves CSS imports from wrong base when Next.js doesn't
// set opts.from in the PostCSS result - it ends up resolving from apps/ (parent
// of apps/web/) instead of apps/web/, so tailwindcss is not found.
// __tw_resolve is checked first by @tailwindcss/node before falling back to
// enhanced-resolve, so we can intercept here without patching node_modules.
;(globalThis as typeof globalThis & { __tw_resolve?: (id: string) => string | null })
  .__tw_resolve = (id: string) => {
  const base = path.join(process.cwd(), 'node_modules')
  if (id === 'tailwindcss') return path.join(base, 'tailwindcss/index.css')
  if (id.startsWith('tailwindcss/')) return path.join(base, id.replace('tailwindcss/', 'tailwindcss/') + '.css')
  return null
}

const devOrigins = process.env.DEV_ORIGINS?.split(',').filter(Boolean) ?? []
const backendUrl = process.env.BACKEND_URL
  ?? (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:5001'
    : (() => { throw new Error('Missing required env var: BACKEND_URL') })())

if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'NEXT_PUBLIC_KEYCLOAK_URL',
    'NEXT_PUBLIC_KEYCLOAK_REALM',
    'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
  ]
  for (const key of requiredEnvVars) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
  }
}

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(process.env.NODE_ENV === 'development' && devOrigins.length > 0
    ? { allowedDevOrigins: devOrigins }
    : {}),
  async headers() {
    const keycloakOrigin  = process.env.NEXT_PUBLIC_KEYCLOAK_URL  ?? 'http://localhost:8080'
    const storageOrigin   = process.env.NEXT_PUBLIC_STORAGE_URL   ?? 'http://localhost:9000'
    const csp = [
      "default-src 'self'",
      // unsafe-eval + unsafe-inline required by Next.js dev mode; removed in production
      process.env.NODE_ENV === 'production'
        ? "script-src 'self' https://js.stripe.com"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https: ${storageOrigin}`,
      "font-src 'self' data:",
      `connect-src 'self' blob: wss: ${keycloakOrigin} ${storageOrigin} https://api.stripe.com https://*.stripe.com`,
      `frame-src 'self' ${keycloakOrigin} https://js.stripe.com`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "media-src 'self' blob:",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          ] : []),
        ],
      },
      {
        source: '/obs/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      // /api/* is handled by app/api/[...path]/route.ts (BFF proxy) - no rewrite needed
      {
        source: '/hubs/:path*',
        destination: `${backendUrl}/hubs/:path*`,
      },
    ]
  },
}

export default nextConfig
