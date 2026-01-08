import {
  BaseMessage,
  BaseRoom,
  cacheKeyRoomOnline,
  MsgReceivedSchema,
  RoomCreatedSchema,
  SocketNotAuthedSchema,
  UserJoinedSchema,
  UserLeftSchema,
  UserStatusSchema,
  UserTypingSchema,
} from '@chatbox/contracts'
import { AuthService, Scopes, UserJwtPayload } from '@chatbox/nest-auth'
import { type ChatConfig, chatConfig, getErrorMessage, RedisToken } from '@chatbox/nest-infra'
import { RoomService as RoomPersistance } from '@chatbox/nest-persistence'
import { Inject, Logger, Optional } from '@nestjs/common'
import { ChatMetricsService } from '../metrics/chat-metrics.service'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { chatEvents, ClientEvents, ServerEvents } from '@chatbox/contracts'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import type Redis from 'ioredis'
import {
  RemoteSocket,
  Server,
  Socket,
} from 'socket.io'
import { UserTypingCompactDto } from '../dto/chat.dto'

export type ChatSocket = Socket<ClientEvents, ServerEvents, any, UserJwtPayload>
export type RemoteChatSocket = RemoteSocket<ServerEvents, UserJwtPayload>
export type ServerSocket = Server<ClientEvents, ServerEvents, any, UserJwtPayload>

// @issue: no way to pass parsed env var to decorator
@WebSocketGateway({
  path: process.env.CHAT_WEBSOCKET_PATH || "unset_socket_path",
  namespace: process.env.CHAT_WEBSOCKET_URL || "unset_socket_namespace",
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {

      // non browser connection
      if (!origin) {
        callback(null, true)
        return
      }

      const allowedOrigins = process.env.CHAT_WEBSOCKET_ALLOWED_ORIGINS?.split(',') || []

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    credentials: true,
  },
  transport: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server!: ServerSocket
  private readonly logger = new Logger(ChatGateway.name)

  // Rate limiter for typing events 
  private typingRateLimiter!: RateLimiterRedis

  constructor(
    private readonly authService: AuthService,
    private readonly roomPersistance: RoomPersistance,
    @Inject(RedisToken) private readonly redis: Redis,
    @Inject(chatConfig.KEY) private readonly config: ChatConfig,
    @Optional() private readonly metrics: ChatMetricsService,
  ) { }

  afterInit() {
    this.typingRateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:typing',
      points: this.config.websocketRateLimit.typingPoints,
      duration: this.config.websocketRateLimit.typingDuration,
      blockDuration: this.config.websocketRateLimit.typingBlockDuration,
    })

    this.logger.log(
      {
        points: this.config.websocketRateLimit.typingPoints,
        duration: this.config.websocketRateLimit.typingDuration,
        blockDuration: this.config.websocketRateLimit.typingBlockDuration,
      },
      'WebSocket rate limiter initialized'
    )
  }

  async handleConnection(client: ChatSocket) {
    try {
      const token = client.handshake.auth?.token as string
      const payload = await this.authService.verifyTokenWithScopes(token, [Scopes.SOCKET_CHAT])

      client.data = payload

      // Private notification room
      await client.join(payload.sub)

      // Membership rooms to emit userGotOnline
      const memberRooms = await this.roomPersistance.findRoomsByUserId(payload.sub)
      const roomIds = memberRooms.map((r) => r.roomId)

      if (roomIds.length > 0) {
        await client.join(roomIds)

        // Increment socket count per user per room to track online status
        const pipeline = this.redis.pipeline();

        roomIds.forEach((roomId) => {
          pipeline.hincrby(cacheKeyRoomOnline(roomId), payload.sub, 1);

          this.server
            .to(roomId)
            .emit(
              chatEvents.server.userGotOnline,
              UserStatusSchema.parse({ userId: payload.sub, roomId }),
            )
        })

        await pipeline.exec();

        this.logger.debug(
          { userId: payload.sub, roomCount: roomIds.length },
          'User auto-joined membership rooms',
        )
      }

      // @issue: nestjs lifecycle bug, provides the event too late
      client.on(chatEvents.server.socketDisconnecting, async () => {
        const user = client.data
        if (!user || !client.rooms) return

        const rooms = Array.from(client.rooms)
        this.logger.debug('Disconnecting from rooms:', rooms)

        for (const roomId of rooms) {
          if (roomId === client.id || roomId === user.sub) continue

          const remaining = await this.redis.hincrby(cacheKeyRoomOnline(roomId), user.sub, -1)

          if (remaining <= 0) {
            await this.redis.hdel(cacheKeyRoomOnline(roomId), user.sub)
            this.server.to(roomId).emit(
              chatEvents.server.userGotOffline,
              UserStatusSchema.parse({
                userId: user.sub,
                roomId: roomId,
              }),
            )
          }
        }

        this.metrics?.onWsDisconnect()
      })

      this.metrics?.onWsConnect()
      this.logger.debug({ userId: payload.sub }, 'User connected to chat')
    } catch (err) {
      const reason = getErrorMessage(err)
      // @todo: throw proper error to emit unauth, handle general err
      this.logger.warn({ reason }, 'Unauthorized connection rejected')
      client.emit(
        chatEvents.server.socketNotAuthed,
        SocketNotAuthedSchema.parse({ message: reason }),
      )
      client.disconnect(true)
    }
  }

  @SubscribeMessage(chatEvents.client.userTyping)
  async handleUserTyping(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: UserTypingCompactDto,
  ) {
    const { roomId, isTyping } = data
    const { sub: userId, username } = client.data

    try {
      await this.typingRateLimiter.consume(userId)
    } catch (rateLimitError) {
      this.logger.warn(
        { userId, username, roomId, remainingPoints: (rateLimitError as any)?.remainingPoints },
        'User typing rate limit exceeded, event dropped'
      )
      return
    }

    this.logger.debug({ userId, username, roomId, isTyping }, 'User typing event')

    client.to(roomId).emit(
      chatEvents.server.userReportedTyping,
      UserTypingSchema.parse({
        userId,
        username,
        roomId,
        isTyping,
      }),
    )
  }

  emitRoomGroupCreated(payload: BaseRoom) {
    this.logger.debug({ payload }, 'Emitting room created event (Group)')
    this.server.emit(chatEvents.server.roomCreated, RoomCreatedSchema.parse(payload))
  }

  emitRoomDmCreated(targetUserId: string, payload: BaseRoom) {
    this.logger.debug(
      { targetUserId, roomId: payload.roomId },
      'Emitting room created event to specific user (DM)',
    )
    this.server
      .to(targetUserId)
      .emit(chatEvents.server.roomCreated, RoomCreatedSchema.parse(payload))
  }

  emitMessageReceived(payload: BaseMessage) {
    this.logger.debug({ payload }, 'Emitting message received event')
    this.server
      .to(payload.roomId)
      .emit(chatEvents.server.msgReceived, MsgReceivedSchema.parse(payload))
  }

  async addUserToRoomSilent(roomId: string, userId: string): Promise<RemoteChatSocket[]> {
    this.logger.debug({ roomId, userId }, 'Connecting user sockets to room')

    const userSockets = await this.server.in(userId).fetchSockets()
    for (const socket of userSockets) {
      socket.join(roomId)
    }

    if (userSockets.length > 0) {
      await this.redis.hincrby(cacheKeyRoomOnline(roomId), userId, userSockets.length)
    }

    return userSockets
  }

  async addUserToRoom(roomId: string, userId: string) {
    this.logger.debug({ roomId, userId }, 'User joined room - connecting sockets and emitting event')

    const userSockets = await this.addUserToRoomSilent(roomId, userId)

    this.server
      .to(roomId)
      .emit(chatEvents.server.userJoined, UserJoinedSchema.parse({ userId, roomId }))

    if (userSockets.length > 0) {
      this.server
        .to(roomId)
        .emit(chatEvents.server.userGotOnline, UserStatusSchema.parse({ userId, roomId }))
    }
  }

  async removeUserFromRoom(roomId: string, userId: string) {
    this.logger.debug({ roomId, userId }, 'User left room - leaving sockets and emitting event')

    this.server
      .to(roomId)
      .emit(chatEvents.server.userLeft, UserLeftSchema.parse({ userId, roomId }))

    await this.redis.hdel(cacheKeyRoomOnline(roomId), userId)

    const userSockets = await this.server.in(userId).fetchSockets()
    for (const socket of userSockets) {
      socket.leave(roomId)
    }
  }

  // @issue: ghost connections on client crash
  async getOnlineUserIdsInRoom(roomId: string): Promise<Set<string>> {
    const userIds = await this.redis.hkeys(cacheKeyRoomOnline(roomId))
    return new Set(userIds)
  }
}
