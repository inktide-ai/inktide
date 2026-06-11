import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Deprecated. Use POST /api/auth/ws-ticket' },
    { status: 410 },
  )
}
