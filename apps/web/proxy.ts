import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/home', '/edit/', '/souls/', '/projects/', '/checkout', '/billing/success', '/invite/']
const AUTH_ONLY = ['/login', '/register', '/forgot-password']

function isAuthenticated(request: NextRequest): boolean {
  return !!(
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token')
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authed = isAuthenticated(request)

  if (pathname.startsWith('/@')) {
    const slug = pathname.slice(2)
    if (slug) return NextResponse.redirect(new URL(`/p/${slug}`, request.url))
  }

  if (PROTECTED.some(p => pathname.startsWith(p)) && !authed) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (AUTH_ONLY.some(p => pathname.startsWith(p)) && authed) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (pathname === '/' && authed) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons|images|logo|locales|animations|idle|videos|silent-check-sso\\.html|hubs|api).*)',
  ],
}
