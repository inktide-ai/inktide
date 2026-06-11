import { createClient, type RedisClientType } from 'redis'

// eslint-disable-next-line no-var
declare global { var _redisClient: RedisClientType | undefined }

function makeClient(): RedisClientType {
  const client = createClient({ url: process.env.REDIS_URL }) as RedisClientType
  client.on('error', (err) => console.error('[redis-server]', err))
  client.connect().catch((err) => console.error('[redis-server] connect failed', err))
  return client
}

// global._redisClient prevents reconnects on Next.js hot reload in development.
export const redisClient: RedisClientType =
  (global._redisClient ??= makeClient())
