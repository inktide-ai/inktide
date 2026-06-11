import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KC_URL   = process.env.NEXT_PUBLIC_KEYCLOAK_URL   ?? 'http://localhost:8080'
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inktide-app'
const KC_ACCOUNT_BASE = `${KC_URL}/realms/${KC_REALM}/account`

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
): Promise<NextResponse> {
  const session = await auth()
  const accessToken = session?.user?.accessToken
  if (!accessToken) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { path: segments = [] } = await params
  const subPath = segments.length > 0 ? `/${segments.join('/')}` : ''
  const kcUrl = `${KC_ACCOUNT_BASE}${subPath}${request.nextUrl.search}`

  const outHeaders = new Headers()
  outHeaders.set('Authorization', `Bearer ${accessToken}`)
  outHeaders.set('Content-Type', 'application/json')
  outHeaders.set('Accept', 'application/json')

  const kcRes = await fetch(kcUrl, {
    method: request.method,
    headers: outHeaders,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : (request.body as BodyInit),
    ...(['GET', 'HEAD'].includes(request.method) ? {} : { duplex: 'half' }),
  } as RequestInit)

  const responseHeaders = new Headers(kcRes.headers)
  responseHeaders.delete('content-encoding')

  return new NextResponse(kcRes.body, {
    status: kcRes.status,
    statusText: kcRes.statusText,
    headers: responseHeaders,
  })
}

type RouteContext = { params: Promise<{ path?: string[] }> }

export const GET    = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx.params)
export const POST   = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx.params)
export const DELETE = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx.params)
