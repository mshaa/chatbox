'use client'

import { UserChat, UserChats } from '@chatbox/contracts'
import { create } from 'zustand'

export type OptimisticMessage = {
  messageId: string
  clientMsgId: string
  roomId: string
  content: string
  status: 'pending' | 'failed'
  createdAt: Date
  userId: string
}

export type PreviewMessage = {
  roomId: string
  userId: string
  content: string
}

type RoomStore = {
  activeRoom: UserChat | undefined
  typingUsers: string[]
  pendingMessages: Record<string, OptimisticMessage[] | undefined >
  unreadCounts: Record<string, number>
  // Server-provided baseline for sequence calc on socket connect
  baseLastReadIds: Record<string, string>   
  readCounts: Record<string, number>        
  lastReadCursors: Record<string, string>
  lastActivity: Set<string>
  previewMessage: PreviewMessage | null

  reset: () => void

  initRooms: (rooms: UserChats) => void
  initUnreadCounters: (rooms: UserChats) => void
  setActiveRoom: (room: UserChat) => void

  increaseReadCount: (roomId: string, seq: number) => void
  increaseUnreadCount: (roomId: string) => void
  resetUnreadCount: (roomId: string, lastMsgId: string) => void
  updateLastReadCursor: (roomId: string, messageId: string) => void

  updateLastActivity: (roomId: string) => void

  addTypingUser: (username: string) => void
  removeTypingUser: (username: string) => void

  addPendingMessage: (msg: OptimisticMessage) => void
  updateMessageStatus: (roomId: string, clientMsgId: string, status: 'failed') => void
  removePendingMessage: (roomId: string, clientMsgId: string) => void

  setPreviewMessage: (msg: PreviewMessage) => void
}

const initialState = {
  activeRoom: undefined,
  typingUsers: [],
  pendingMessages: {},
  unreadCounts: {},
  baseLastReadIds: {},
  readCounts: {},
  lastReadCursors: {},
  lastActivity: new Set<string>(),
  previewMessage: null as PreviewMessage | null,
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  initRooms: (rooms: UserChats) => {
    const cursors: Record<string, string> = {}
    const baseIds: Record<string, string> = {}
    const activity = new Set(rooms.sort((a, b) => b.unreadCount - a.unreadCount).map((r) => r.roomId))

    rooms.forEach((r) => {
      if (r.lastReadMessageId) {
        cursors[r.roomId] = r.lastReadMessageId
        baseIds[r.roomId] = r.lastReadMessageId
      }
    })

    set({
      lastActivity: activity,
      lastReadCursors: cursors,
      baseLastReadIds: baseIds,
    })

    get().initUnreadCounters(rooms)
  },

  initUnreadCounters: (rooms: UserChats) => {
    const unreadCounts: Record<string, number> = {}
    const readCounts: Record<string, number> = {}

    rooms.forEach((r) => {
      unreadCounts[r.roomId] = r.unreadCount
      readCounts[r.roomId] = 0
    })

    set({ unreadCounts, readCounts })
  },


  setActiveRoom: (room: UserChat) => {
    set({
      activeRoom: room,
      typingUsers: [],
    })
  },

  increaseReadCount: (roomId, seq) => {
    const currentHighest = get().readCounts[roomId] ?? 0
    if (seq > currentHighest) {
      const delta = seq - currentHighest
      set((state) => ({
        readCounts: { ...state.readCounts, [roomId]: seq },
        unreadCounts: {
          ...state.unreadCounts,
          [roomId]: Math.max(0, (state.unreadCounts[roomId] ?? 0) - delta),
        },
      }))
    }
  },

  increaseUnreadCount: (roomId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: (state.unreadCounts[roomId] ?? 0) + 1,
      },
    }))
  },

  resetUnreadCount: (roomId, lastMsgId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [roomId]: 0 },
      baseLastReadIds: { ...state.baseLastReadIds, [roomId]: lastMsgId },
      readCounts: { ...state.readCounts, [roomId]: 0 },
    }))
  },

  updateLastReadCursor: (roomId, messageId) =>
    set((state) => {
      const currentCursor = state.lastReadCursors[roomId]
      if (!currentCursor || messageId > currentCursor) {
        return {
          lastReadCursors: {
            ...state.lastReadCursors,
            [roomId]: messageId,
          },
        }
      }
      return state
    }),

  updateLastActivity: (roomId: string) =>
    set((state) => ({
      lastActivity: new Set([roomId, ...state.lastActivity]),
    })),

  addTypingUser: (username: string) =>
    set((state) => {
      if (state.typingUsers.includes(username)) return state
      return { typingUsers: [...state.typingUsers, username] }
    }),

  removeTypingUser: (username: string) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u !== username),
    })),

  addPendingMessage: (msg: OptimisticMessage) => {
    set((state) => ({
      pendingMessages: {
        ...state.pendingMessages,
        [msg.roomId]: [...(state.pendingMessages[msg.roomId] || []), msg],
      },
    }))
  },

  updateMessageStatus: (roomId: string, clientMsgId: string, status: 'failed') => {
    set((state) => {
      const roomMessages = state.pendingMessages[roomId]
      if (!roomMessages) return state

      const msgIndex = roomMessages.findIndex((m) => m.clientMsgId === clientMsgId)
      if (msgIndex === -1) return state

      return {
        pendingMessages: {
          ...state.pendingMessages,
          [roomId]: roomMessages.map((m, idx) => (idx === msgIndex ? { ...m, status } : m)),
        },
      }
    })
  },

  removePendingMessage: (roomId: string, clientMsgId: string) => {
    set((state) => {
      const roomMessages = state.pendingMessages[roomId]
      if (!roomMessages) return state

      const filteredMessages = roomMessages.filter((m) => m.clientMsgId !== clientMsgId)
      if (filteredMessages.length === roomMessages.length) return state

      const updatedMessages = { ...state.pendingMessages }
      if (filteredMessages.length === 0) {
        delete updatedMessages[roomId]
      } else {
        updatedMessages[roomId] = filteredMessages
      }

      return { pendingMessages: updatedMessages }
    })
  },

  setPreviewMessage: (msg: PreviewMessage) => {
    set({ previewMessage: msg })
  },
}))
