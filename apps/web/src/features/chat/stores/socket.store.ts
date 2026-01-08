'use client'

import { createSocketClient } from '@/lib/socket/socket-client'
import {
  chatEvents,
  ServerEvents,
  UserTypingCompact,
  UserTypingCompactSchema,
} from '@chatbox/contracts'
import { Socket } from 'socket.io-client'
import { create } from 'zustand'

type SocketStore = {
  socket: Socket | null
  isConnected: boolean

  init: (token: string) => void
  registerHandlers: (handlers: Partial<ServerEvents>) => void
  connect: () => void
  disconnect: () => void
  destroy: () => void
  updateAuth: (newToken: string) => void

  emitUserTyping: (payload: UserTypingCompact) => void
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  init: (token: string) => {
    const existing = get().socket
    if (existing) return 

    const socket = createSocketClient({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
    })

    socket.auth = { token }

    set({ socket, isConnected: false })
  },

  registerHandlers: (handlers: Partial<ServerEvents>) => {
    const { socket } = get()
    if (!socket) return

    for (const event of Object.keys(handlers)) {
      socket.off(event)
    }

    for (const event of Object.keys(handlers) as Array<keyof Partial<ServerEvents>>) {
      socket.on(event, handlers[event]!)
    }
  },

  connect: () => {
    const { socket } = get()
    if (socket && !socket.connected) {
      socket.connect()
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.disconnect()
    }
  },

  destroy: () => {
    const { socket } = get()
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }
    set({ socket: null, isConnected: false })
  },

  updateAuth: (newToken: string) => {
    const { socket } = get()
    if (socket) {
      socket.auth = { token: newToken }
    }
  },

  emitUserTyping: (payload: UserTypingCompact) => {
    get().socket?.emit(chatEvents.client.userTyping, UserTypingCompactSchema.parse(payload))
  },
}))
