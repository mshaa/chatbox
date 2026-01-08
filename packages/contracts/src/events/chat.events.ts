import { z } from 'zod'
import { MsgReceivedSchema } from '../message'
import {
    RoomCreatedSchema,
    UserJoinedSchema,
    UserLeftSchema,
    UserStatusSchema,
    UserTypingCompactSchema,
    UserTypingSchema,
} from '../room'
import { SocketNotAuthedSchema } from '../socket'

export const chatEvents = {
  client: {
    userTyping: 'user:typing',
  },
  server: {
    userJoined: 'room:user_joined',
    userLeft: 'room:user_left',
    roomCreated: 'room:created',
    msgReceived: 'msg:received',
    userReportedTyping: 'user:reported_typing',
    userGotOnline: 'user:got_online',
    userGotOffline: 'user:got_offline',
    socketNotAuthed: 'socket:not-authed',
    socketConnected: 'connect',
    socketDisconnected: 'disconnect',
    socketDisconnecting: 'disconnecting',
  },
} as const

export type ClientEvents = {
  [chatEvents.client.userTyping]: (data: z.infer<typeof UserTypingCompactSchema>) => void
}

export type ServerEvents = {
  [chatEvents.server.userJoined]: (data: z.infer<typeof UserJoinedSchema>) => void
  [chatEvents.server.userLeft]: (data: z.infer<typeof UserLeftSchema>) => void
  [chatEvents.server.roomCreated]: (data: z.infer<typeof RoomCreatedSchema>) => void
  [chatEvents.server.msgReceived]: (data: z.infer<typeof MsgReceivedSchema>) => void
  [chatEvents.server.userReportedTyping]: (data: z.infer<typeof UserTypingSchema>) => void
  [chatEvents.server.userGotOnline]: (data: z.infer<typeof UserStatusSchema>) => void
  [chatEvents.server.userGotOffline]: (data: z.infer<typeof UserStatusSchema>) => void
  [chatEvents.server.socketNotAuthed]: (data: z.infer<typeof SocketNotAuthedSchema>) => void
  [chatEvents.server.socketConnected]: () => void
  [chatEvents.server.socketDisconnected]: () => void
  [chatEvents.server.socketDisconnecting]: () => void
}
