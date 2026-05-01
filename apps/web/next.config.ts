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

const nextConfig: NextConfig = {
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
        destination: 'http://127.0.0.1:5001/api/:path*',
      },
      {
        source: '/hubs/:path*',
        destination: 'http://127.0.0.1:5001/hubs/:path*',
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
