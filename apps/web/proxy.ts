import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/edit/sandbox', '/edit/settings', '/pricing', '/checkout']
const AUTH_ONLY = ['/login', '/register', '/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = !!request.cookies.get('inktide_auth')

  // Redirect /@slug → /p/slug
  if (pathname.startsWith('/@')) {
    const slug = pathname.slice(2)
    if (slug) return NextResponse.redirect(new URL(`/p/${slug}`, request.url))
  }

  if (PROTECTED.some(p => pathname.startsWith(p)) && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (AUTH_ONLY.some(p => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|icons|images|logo|locales|animations|idle|videos|silent-check-sso\\.html).*)'],
}
