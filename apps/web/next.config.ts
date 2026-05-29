import type { NextConfig } from 'next'
import path from 'path'

// @tailwindcss/node resolves CSS imports from wrong base when Next.js doesn't
// set opts.from in the PostCSS result — it ends up resolving from apps/ (parent
// of apps/web/) instead of apps/web/, so tailwindcss is not found.
// __tw_resolve is checked first by @tailwindcss/node before falling back to
// enhanced-resolve, so we can intercept here without patching node_modules.
;(globalThis as any).__tw_resolve = (id: string) => {
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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',       value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
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
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack', options: { svgo: false } }],
        as: '*.js',
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/hubs/:path*',
        destination: `${backendUrl}/hubs/:path*`,
      },
    ]
  },
}

export default nextConfig
