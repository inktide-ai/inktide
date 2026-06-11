// Server Components only — do NOT import in 'use client' files
import { auth } from '@/lib/auth'

export interface ServerUser {
  userId: string
  name: string
  picture: string | null
}

export async function getServerUser(): Promise<ServerUser | null> {
  const session = await auth()
  if (!session?.user?.userId) return null
  return {
    userId:  session.user.userId,
    name:    session.user.name,
    picture: session.user.image ?? null,
  }
}
