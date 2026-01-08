import {
  API_ROUTES,
  CACHE_KEY_LAST_READ_DIRTY,
  cacheKeyLastRead,
  chatEvents,
  MESSAGE_PERSISTED_EVENT,
  PERSISTENCE_QUEUE,
} from '@chatbox/contracts'
import { AuthService } from '@chatbox/nest-auth'
import { AppLogger, chatConfig, ChatConfig, queueConfig, QueueConfig, RedisToken } from '@chatbox/nest-infra'
import { getSeedData, seed } from '@chatbox/persistence/seed'
import { getQueueToken } from '@nestjs/bullmq'
import { INestApplication } from '@nestjs/common'
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices'
import { Test, TestingModule } from '@nestjs/testing'
import { Queue } from 'bullmq'
import type Redis from 'ioredis'
import { io, Socket } from 'socket.io-client'
import request from 'supertest'
import { v7 } from 'uuid'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ChatModule } from '../src/chat.module'

type AuthenticatedUser = {
  token: string
  socket: Socket
  data: Awaited<ReturnType<typeof getSeedData>>['users'][number]
}

type SeedData = Awaited<ReturnType<typeof getSeedData>>

const waitForEvent = <T = unknown>(
  socket: Socket,
  event: string,
  timeoutMs = 5000,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, handler)
      reject(new Error(`Timeout waiting for event "${event}" after ${timeoutMs}ms`))
    }, timeoutMs)

    const handler = (data: T) => {
      clearTimeout(timeout)
      resolve(data)
    }

    socket.once(event, handler)
  })

const waitForConnect = (socket: Socket, timeoutMs = 5000): Promise<void> =>
  new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onError)
      reject(new Error(`Socket connection timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    const onConnect = () => {
      clearTimeout(timeout)
      socket.off('connect_error', onError)
      resolve()
    }

    const onError = (err: Error) => {
      clearTimeout(timeout)
      socket.off('connect', onConnect)
      reject(new Error(`Socket connection failed: ${err.message}`))
    }

    socket.once('connect', onConnect)
    socket.once('connect_error', onError)
  })

const waitForDisconnect = (socket: Socket, timeoutMs = 5000): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!socket.connected) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      reject(new Error(`Socket disconnect timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    socket.once('disconnect', () => {
      clearTimeout(timeout)
      resolve()
    })
  })

describe('Chat (e2e)', () => {
  let app: INestApplication
  let seedData: SeedData
  let persistenceQueue: Queue
  let chatEventEmitter: ClientProxy
  let redis: Redis
  let config: ChatConfig

  const authenticatedUsers: AuthenticatedUser[] = []

  const createSocket = (port: number, token: string): Socket => {
    return io(`http://localhost:${port}${config.websocketUrl}`, {
      path: config.websocketPath,
      auth: { token },
      autoConnect: false,
      forceNew: true,
    })
  }

  const getUser = (username: string): AuthenticatedUser => {
    const user = authenticatedUsers.find((u) => u.data.username === username)
    if (!user) throw new Error(`User "${username}" not found`)
    return user
  }

  const getRoom = (name: string) => {
    const room = seedData.rooms.find((r) => r.name === name)
    if (!room) throw new Error(`Room "${name}" not found`)
    return room
  }

  beforeAll(async () => {
    seedData = await seed()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ChatModule,
        ClientsModule.registerAsync([
          {
            name: 'CHAT_SERVICE_EMITTER',
            useFactory: () => ({
              transport: Transport.REDIS,
              options: { host: 'localhost', port: 6379 },
            }),
          },
        ]),
      ],
    })
      .overrideProvider(queueConfig.KEY)
      .useValue({ ...queueConfig(), persistReadMsgId: 'write-behind' })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useLogger(app.get(AppLogger))

    const queueConf = app.get<QueueConfig>(queueConfig.KEY)

    app.connectMicroservice({
      transport: Transport.REDIS,
      options: {
        host: queueConf.redis.host,
        port: queueConf.redis.port,
      },
    })

    await app.startAllMicroservices()
    await app.init()

    persistenceQueue = app.get<Queue>(getQueueToken(PERSISTENCE_QUEUE))
    chatEventEmitter = app.get('CHAT_SERVICE_EMITTER')
    redis = app.get<Redis>(RedisToken)
    config = app.get<ChatConfig>(chatConfig.KEY)

    await chatEventEmitter.connect()
    await app.listen(config.port)

    const port = app.getHttpServer().address().port

    const authService = app.get(AuthService)

    for (const user of seedData.users) {
      const { access_token } = await authService.signIn(user.username, 'password')
      const socket = createSocket(port, access_token)

      socket.connect()
      await waitForConnect(socket)

      authenticatedUsers.push({ token: access_token, socket, data: user })
    }
  }, 60000)

  afterEach(async () => {
    await persistenceQueue.obliterate({ force: true })
  })

  afterAll(async () => {
    for (const user of authenticatedUsers) {
      if (user.socket.connected) {
        user.socket.disconnect()
      }
    }
    authenticatedUsers.length = 0

    const repeatables = await persistenceQueue.getRepeatableJobs()
    for (const job of repeatables) {
      await persistenceQueue.removeRepeatableByKey(job.key)
    }

    await chatEventEmitter.close()
    await app.close()
  }, 30000)

  describe('HTTP API', () => {
    it('GET /users/me - returns current user profile', async () => {
      const user = getUser('user_main')

      const response = await request(app.getHttpServer())
        .get(API_ROUTES.USERS.ME)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBe(user.data.userId)
      expect(response.body.data.username).toBe(user.data.username)
    })

    it('GET /users/me/chats - returns user chats', async () => {
      const user = getUser('user_main')

      const response = await request(app.getHttpServer())
        .get(API_ROUTES.USERS.ME_CHATS)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)

      const expectedRoomCount = seedData.roomUsers.filter(
        (ru) => ru.userId === user.data.userId,
      ).length
      expect(response.body.data).toHaveLength(expectedRoomCount)
    })

    it('GET /rooms/discover - returns discoverable group rooms', async () => {
      const user = getUser('user_main')

      const response = await request(app.getHttpServer())
        .get(API_ROUTES.ROOMS.DISCOVER)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      const groupRooms = seedData.rooms.filter((r) => r.type === 'group')
      expect(response.body.data).toHaveLength(groupRooms.length)
      expect(typeof response.body.data[0].memberCount).toBe('number')
    })

    it('POST /rooms/group - creates a group room and broadcasts event', async () => {
      const creator = getUser('user_main')
      const roomName = `Test Room ${v7()}`

      const eventPromises = authenticatedUsers.map((u) =>
        waitForEvent(u.socket, chatEvents.server.roomCreated),
      )

      const response = await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.GROUP)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: roomName })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(roomName)
      expect(response.body.data.type).toBe('group')

      const events = await Promise.all(eventPromises)
      events.forEach((event: any) => {
        expect(event.roomId).toBe(response.body.data.roomId)
        expect(event.name).toBe(roomName)
      })
    })

    it('POST /rooms/dm - creates a DM room and notifies target user', async () => {
      const creator = getUser('user_no_rooms')
      const target = getUser('user_main')
      const clientMsgId = v7()

      const eventPromise = waitForEvent(target.socket, chatEvents.server.roomCreated)

      const response = await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.DM)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({
          targetUserId: target.data.userId,
          content: 'Hello from DM test!',
          clientMsgId,
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('dm')

      const event: any = await eventPromise
      expect(event.roomId).toBe(response.body.data.roomId)
      expect(event.type).toBe('dm')
    })

    it('GET /rooms/:id/members - returns members with online status', async () => {
      const user = getUser('user_main')
      const room = getRoom('General')

      const response = await request(app.getHttpServer())
        .get(API_ROUTES.ROOMS.BY_ID.MEMBERS(room.roomId))
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      const expectedMembers = seedData.roomUsers.filter((ru) => ru.roomId === room.roomId)
      expect(response.body.data).toHaveLength(expectedMembers.length)

      response.body.data.forEach((member: { userId: string; isOnline: boolean }) => {
        const isConnected = authenticatedUsers.some(
          (u) => u.data.userId === member.userId && u.socket.connected,
        )
        expect(member.isOnline).toBe(isConnected)
      })
    })

    it('GET /rooms/:id/messages - returns room history', async () => {
      const user = getUser('user_main')
      const room = getRoom('General')

      const response = await request(app.getHttpServer())
        .get(API_ROUTES.ROOMS.BY_ID.MESSAGES(room.roomId))
        .query({ limit: 50 })
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.items).toBeDefined()

      const expectedMessages = seedData.messages.filter((m) => m.roomId === room.roomId)
      expect(response.body.data.items).toHaveLength(expectedMessages.length)
    })

    it('POST /rooms/:id/messages - queues message and broadcasts after persistence event', async () => {
      const room = getRoom('General')
      const sender = getUser('user_main')
      const content = `Test message ${v7()}`
      const clientMsgId = v7()

      const roomMembers = authenticatedUsers.filter((u) =>
        seedData.roomUsers.some(
          (ru) => ru.userId === u.data.userId && ru.roomId === room.roomId,
        ),
      )

      const messagePromises = roomMembers.map((u) =>
        waitForEvent(u.socket, chatEvents.server.msgReceived),
      )

      const response = await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.BY_ID.MESSAGES(room.roomId))
        .set('Authorization', `Bearer ${sender.token}`)
        .send({ content, clientMsgId })
        .expect(202)

      expect(response.body.success).toBe(true)
      const { messageId } = response.body.data

      const jobCounts = await persistenceQueue.getJobCounts()
      expect(jobCounts.waiting + jobCounts.active).toBeGreaterThanOrEqual(1)

      chatEventEmitter.emit(MESSAGE_PERSISTED_EVENT, {
        messageId,
        roomId: room.roomId,
        userId: sender.data.userId,
        content,
        clientMsgId,
        createdAt: new Date(),
      })

      const events = await Promise.all(messagePromises)
      events.forEach((event: any) => {
        expect(event.messageId).toBe(messageId)
        expect(event.content).toBe(content)
      })
    })

    it('POST /rooms/:id/join - joins room and notifies members', async () => {
      const room = getRoom('Join Target')
      const joiner = getUser('user_joiner')
      const existingMember = getUser('user_main')

      const eventPromise = waitForEvent(existingMember.socket, chatEvents.server.userJoined)

      await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.BY_ID.JOIN(room.roomId))
        .set('Authorization', `Bearer ${joiner.token}`)
        .expect(200)

      const event: any = await eventPromise
      expect(event.userId).toBe(joiner.data.userId)
      expect(event.roomId).toBe(room.roomId)
    })

    it('POST /rooms/:id/leave - leaves room and notifies members', async () => {
      const room = getRoom('General')
      const leaver = getUser('user_leaver')
      const remainingMember = getUser('user_observer')

      const eventPromise = waitForEvent(remainingMember.socket, chatEvents.server.userLeft)

      await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.BY_ID.LEAVE(room.roomId))
        .set('Authorization', `Bearer ${leaver.token}`)
        .expect(200)

      const event: any = await eventPromise
      expect(event.userId).toBe(leaver.data.userId)
      expect(event.roomId).toBe(room.roomId)
    })
  })

  describe('Socket.IO Events', () => {
    it('emits userGotOnline when user reconnects', async () => {
      const room = getRoom('General')
      const testUser = getUser('user_main')
      const observer = getUser('user_observer')

      const onlinePromise = new Promise<any>((resolve) => {
        const handler = (payload: any) => {
          if (payload.userId === testUser.data.userId && payload.roomId === room.roomId) {
            observer.socket.off(chatEvents.server.userGotOnline, handler)
            resolve(payload)
          }
        }
        observer.socket.on(chatEvents.server.userGotOnline, handler)
      })

      testUser.socket.disconnect()
      await waitForDisconnect(testUser.socket)

      testUser.socket.connect()
      await waitForConnect(testUser.socket)

      const event = await onlinePromise
      expect(event.userId).toBe(testUser.data.userId)
      expect(event.roomId).toBe(room.roomId)
    })

    it('broadcasts typing notifications to room members', async () => {
      const room = getRoom('General')
      const typingUser = getUser('user_main')
      const receiver = getUser('user_observer')

      const typingPromise = waitForEvent(receiver.socket, chatEvents.server.userReportedTyping)

      typingUser.socket.emit(chatEvents.client.userTyping, {
        roomId: room.roomId,
        isTyping: true,
      })

      const event: any = await typingPromise
      expect(event.userId).toBe(typingUser.data.userId)
      expect(event.username).toBe(typingUser.data.username)
      expect(event.roomId).toBe(room.roomId)
      expect(event.isTyping).toBe(true)
    })

    it('emits userGotOffline when user disconnects', async () => {
      const room = getRoom('General')
      const disconnectingUser = getUser('user_member')
      const observer = getUser('user_observer')

      const offlinePromise = new Promise<any>((resolve) => {
        const handler = (payload: any) => {
          if (payload.userId === disconnectingUser.data.userId) {
            observer.socket.off(chatEvents.server.userGotOffline, handler)
            resolve(payload)
          }
        }
        observer.socket.on(chatEvents.server.userGotOffline, handler)
      })

      disconnectingUser.socket.disconnect()
      await waitForDisconnect(disconnectingUser.socket)

      const event = await offlinePromise
      expect(event.userId).toBe(disconnectingUser.data.userId)

      disconnectingUser.socket.connect()
      await waitForConnect(disconnectingUser.socket)
    })

    it('emits userGotOnline when user joins room via HTTP', async () => {
      const creator = getUser('user_main')
      const joiner = getUser('user_observer')

      const createResponse = await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.GROUP)
        .set('Authorization', `Bearer ${creator.token}`)
        .send({ name: `Join Socket Test ${v7()}` })
        .expect(201)

      const newRoomId = createResponse.body.data.roomId

      await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.BY_ID.JOIN(newRoomId))
        .set('Authorization', `Bearer ${creator.token}`)
        .expect(200)

      const onlinePromise = new Promise<any>((resolve) => {
        const handler = (payload: any) => {
          if (payload.userId === joiner.data.userId && payload.roomId === newRoomId) {
            creator.socket.off(chatEvents.server.userGotOnline, handler)
            resolve(payload)
          }
        }
        creator.socket.on(chatEvents.server.userGotOnline, handler)
      })

      await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.BY_ID.JOIN(newRoomId))
        .set('Authorization', `Bearer ${joiner.token}`)
        .expect(200)

      const event = await onlinePromise
      expect(event.userId).toBe(joiner.data.userId)
      expect(event.roomId).toBe(newRoomId)
    })
  })

  describe('Last-Read Persistence (write-behind)', () => {
    it('writes last-read cursor to Redis and tracks in dirty set', async () => {
      const room = getRoom('General')
      const user = getUser('user_main')
      const message = seedData.messages.find((m) => m.roomId === room.roomId)!

      const cacheKey = cacheKeyLastRead(room.roomId, user.data.userId)
      await redis.del(cacheKey)
      await redis.srem(CACHE_KEY_LAST_READ_DIRTY, `${room.roomId}:${user.data.userId}`)

      await request(app.getHttpServer())
        .post(API_ROUTES.ROOMS.BY_ID.READ(room.roomId))
        .set('Authorization', `Bearer ${user.token}`)
        .send({ messageId: message.messageId })
        .expect(200)

      const cachedMessageId = await redis.get(cacheKey)
      expect(cachedMessageId).toBe(message.messageId)

      const isDirty = await redis.sismember(
        CACHE_KEY_LAST_READ_DIRTY,
        `${room.roomId}:${user.data.userId}`,
      )
      expect(isDirty).toBe(1)
    })
  })
})
