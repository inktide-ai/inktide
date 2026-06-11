import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:5001'

const STRIP_HEADERS = new Set(['host', 'x-user-id', 'x-user-name', 'x-user-picture'])

// auth() is request-scoped (AsyncLocalStorage) and called once per request.
// It must NOT be cached in module scope — a shared cache would hand one user's
// session to a concurrent request from a different user (cross-tenant leak).

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<NextResponse> {
  const { path: segments } = await params
  const path = segments.join('/')

  // auth/* is handled by next-auth handler — should never reach here
  if (path.startsWith('auth/')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const session    = await auth()
  const accessToken = session?.user?.accessToken

  const backendUrl = `${BACKEND_URL}/api/${path}${request.nextUrl.search}`

  const buildHeaders = (token: string | undefined) => {
    const h = new Headers()
    request.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) h.set(key, value)
    })
    if (token) h.set('Authorization', `Bearer ${token}`)
    return h
  }

  const fetchOptions = (headers: Headers): RequestInit => ({
    method: request.method,
    headers,
    body:   ['GET', 'HEAD'].includes(request.method) ? undefined : (request.body as BodyInit),
    ...((['GET', 'HEAD'].includes(request.method)) ? {} : { duplex: 'half' }),
  } as RequestInit)

  let backendRes: Response
  try {
    backendRes = await fetch(backendUrl, fetchOptions(buildHeaders(accessToken)))
  } catch (err) {
    // Upstream unreachable / aborted — surface a gateway error instead of crashing the route.
    // NOTE: no full-request AbortSignal timeout here on purpose — the proxy streams long-lived
    // responses (SSE / LLM / TTS) and a blanket timeout would cut them off mid-stream.
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return new NextResponse(
      JSON.stringify({ error: isAbort ? 'Upstream timeout' : 'Upstream unavailable' }),
      { status: isAbort ? 504 : 502, headers: { 'content-type': 'application/json' } },
    )
  }

  const responseHeaders = new Headers(backendRes.headers)
  responseHeaders.delete('content-encoding')

  return new NextResponse(backendRes.body, {
    status:     backendRes.status,
    statusText: backendRes.statusText,
    headers:    responseHeaders,
  })
}

export const GET    = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => proxyRequest(req, params)
export const POST   = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => proxyRequest(req, params)
export const PUT    = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => proxyRequest(req, params)
export const PATCH  = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => proxyRequest(req, params)
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => proxyRequest(req, params)
