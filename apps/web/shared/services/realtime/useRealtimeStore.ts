'use client'
import { create } from 'zustand'
import { HubConnectionBuilder, HubConnection, HttpTransportType, LogLevel } from '@microsoft/signalr'

interface RealtimeStore {
  connection: HubConnection | null
  channelId: string | null
  connected: boolean
  /** Number of active consumers sharing this connection. */
  consumers: number
  connect: (channelId: string, getToken: () => Promise<string>) => Promise<void>
  disconnect: () => Promise<void>
  /**
   * Subscribe to a hub event. Generic over the handler's arguments so each
   * caller keeps its own payload type instead of widening the store's
   * interface to `any`. Returns an unsubscribe function.
   */
  on: <TArgs extends unknown[]>(
    event: string,
    handler: (...args: TArgs) => void,
  ) => () => void
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  connection: null,
  channelId: null,
  connected: false,
  consumers: 0,

  connect: async (channelId, getToken) => {
    const state = get()

    // Reuse existing connection if same channelId - just increment consumer count
    if (state.connection && state.channelId === channelId) {
      set({ consumers: state.consumers + 1 })
      return
    }

    if (state.connection) await state.disconnect()

    const conn = new HubConnectionBuilder()
      .withUrl('/hubs/audio', {
        accessTokenFactory: getToken,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    conn.onreconnected(() => {
      conn.invoke('JoinChannel', channelId).catch(() => {})
      set({ connected: true })
    })

    conn.onclose(() => set({ connected: false }))

    await conn.start()
    await conn.invoke('JoinChannel', channelId)
    set({ connection: conn, channelId, connected: true, consumers: 1 })
  },

  disconnect: async () => {
    const { connection, consumers } = get()
    if (consumers > 1) {
      set({ consumers: consumers - 1 })
      return
    }
    await connection?.stop()
    set({ connection: null, channelId: null, connected: false, consumers: 0 })
  },

  on: (event, handler) => {
    // SignalR types its callback as (...args: any[]) => void, so the widening
    // happens here once rather than in every caller's payload type.
    const forward = handler as (...args: unknown[]) => void
    get().connection?.on(event, forward)
    return () => {
      get().connection?.off(event, forward)
    }
  },
}))
