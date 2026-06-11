import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { redisClient } from '@/lib/redis-server'

const TICKET_TTL_SECONDS = 30

export async function POST() {
  const session = await auth()
  if (!session?.user?.userId) {
    return NextResponse.json(null, { status: 401 })
  }

  const ticket = crypto.randomUUID().replace(/-/g, '')

  await redisClient.set(`ws:ticket:${ticket}`, session.user.userId, {
    EX: TICKET_TTL_SECONDS,
  })

  return NextResponse.json({ ticket })
}
