#!/usr/bin/env node
'use strict'

const signalR = require('@microsoft/signalr')
const Redis   = require('ioredis')

const CHANNEL_ID    = process.env.CHANNEL_ID
const CHARACTER_ID  = process.env.CHARACTER_ID || null
const JWT_TOKEN     = process.env.JWT_TOKEN
const MESSAGE       = process.env.MESSAGE || 'Hello, benchmark test.'
const API_URL       = process.env.API_URL  || 'http://localhost:5001'
const REDIS_URL     = process.env.REDIS_URL || 'redis://localhost:6379'
const SLO_MS     = 4000
const TIMEOUT_MS = 30_000
const JSON_MODE  = process.argv.includes('--json') || process.env.JSON_OUTPUT === '1'

function log(...args) {
  if (!JSON_MODE) console.log(...args)
}

function fatal(errorCode, err) {
  if (JSON_MODE) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), error: errorCode, message: err.message ?? String(err) }))
  } else {
    console.error(`[ERROR] ${errorCode}: ${err.message ?? err}`)
  }
  process.exit(1)
}

if (!CHANNEL_ID) fatal('MISSING_ENV', new Error('CHANNEL_ID is required'))
if (!JWT_TOKEN)  fatal('MISSING_ENV', new Error('JWT_TOKEN is required'))
if (!CHARACTER_ID) log('[WARN] CHARACTER_ID not set — pipeline will abort if channel registry is unavailable')

async function run() {
  const redis = new Redis(REDIS_URL, { lazyConnect: true })

  redis.on('error', err => fatal('REDIS_ERROR', err))

  try {
    await redis.connect()
  } catch (err) {
    fatal('REDIS_ERROR', err)
  }

  log(`Connecting to SignalR: ${API_URL}/hubs/audio`)

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/audio`, { accessTokenFactory: () => JWT_TOKEN })
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  let publishTime   = null
  let firstByteMs   = null
  let totalMs       = null
  let chunkCount    = 0
  let finished      = false

  const timeout = setTimeout(() => {
    if (!finished) fatal('TIMEOUT', new Error(`No audio received within ${TIMEOUT_MS}ms`))
  }, TIMEOUT_MS)

  connection.on('audioReceived', payload => {
    if (finished) return
    const now = Date.now()
    chunkCount++

    if (firstByteMs === null) {
      firstByteMs = now - publishTime
      log(`[t=${firstByteMs}ms]  First audio chunk (seq=${payload.sequenceNumber ?? '?'})`)
    } else {
      log(`[t=${now - publishTime}ms]  Audio chunk (seq=${payload.sequenceNumber ?? '?'})`)
    }

    if (payload.isLast) {
      totalMs  = now - publishTime
      finished = true
      clearTimeout(timeout)

      log(`[t=${totalMs}ms]  Last chunk received`)
      log('')
      log(`First-byte latency : ${firstByteMs}ms`)
      log(`Full-response latency: ${totalMs}ms`)
      log(`Chunks: ${chunkCount}`)
      log(`SLO (< ${SLO_MS}ms): ${totalMs <= SLO_MS ? 'PASS' : 'FAIL'}`)

      if (JSON_MODE) {
        console.log(JSON.stringify({
          ts:            new Date().toISOString(),
          channelId:     CHANNEL_ID,
          message:       MESSAGE,
          firstByteMs,
          totalMs,
          chunks:        chunkCount,
          sloViolation:  totalMs > SLO_MS,
          sloThresholdMs: SLO_MS,
        }))
      }

      redis.disconnect()
      connection.stop().catch(() => {})
      process.exit(0)
    }
  })

  connection.onclose(err => {
    if (!finished) fatal('SIGNALR_ERROR', err ?? new Error('Connection closed unexpectedly'))
  })

  try {
    await connection.start()
  } catch (err) {
    fatal('SIGNALR_ERROR', err)
  }

  log(`Joined channel: ${CHANNEL_ID}`)
  await connection.invoke('JoinChannel', CHANNEL_ID)

  const now = new Date().toISOString()
  const message = {
    platformId:   'discord',
    channelId:    CHANNEL_ID,
    channelName:  'benchmark',
    ...(CHARACTER_ID && { characterId: CHARACTER_ID }),
    sender: {
      userId:        'bench',
      userName:      'benchmark',
      badges:        [],
      isModerator:   false,
      isSubscriber:  false,
      isVip:         false,
      isBroadcaster: false,
    },
    text:      MESSAGE,
    timestamp: now,
    stream: {
      channelId:  CHANNEL_ID,
      status:     2,
      startedAt:  now,
    },
  }

  publishTime = Date.now()
  await redis.xadd('synapse.ingest', '*', 'payload', JSON.stringify(message))
  log(`[t=0ms]    Message published to synapse.ingest`)
  log(`           text: "${MESSAGE}"`)
}

run().catch(err => fatal('UNEXPECTED', err))
