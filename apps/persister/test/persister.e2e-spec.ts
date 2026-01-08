import {
    BaseMessage,
    CACHE_KEY_LAST_READ_DIRTY,
    cacheKeyLastRead,
    MESSAGE_PERSISTED_EVENT,
    PERSIST_MESSAGE_JOB,
    PERSISTENCE_QUEUE,
    SYNC_LAST_READ_JOB,
} from '@chatbox/contracts'
import { AppLogger, queueConfig, RedisToken } from '@chatbox/nest-infra'
import { MessageService, RoomService } from '@chatbox/nest-persistence'
import { getSeedData, seed } from '@chatbox/persistence/seed'
import { getQueueToken } from '@nestjs/bullmq'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Queue, QueueEvents } from 'bullmq'
import { Redis, RedisOptions } from 'ioredis'
import { v7 } from 'uuid'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { PersisterModule } from '../src/persister.module'

describe('Persister (e2e)', () => {
  let app: INestApplication
  let queue: Queue
  let queueEvents: QueueEvents
  let messageService: MessageService
  let roomService: RoomService
  let redis: Redis
  let seedData: Awaited<ReturnType<typeof getSeedData>>
  let redisSubscriber: Redis

  const setupApp = async (persistMode: 'write-behind' | 'direct') => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PersisterModule],
    })
      .overrideProvider(queueConfig.KEY)
      .useValue({
        ...queueConfig(),
        persistReadMsgId: persistMode,
        jobSyncLastReadIntervalMs: 2_000
      })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useLogger(app.get(AppLogger))
    app.enableShutdownHooks()
    await app.init()

    queue = app.get<Queue>(getQueueToken(PERSISTENCE_QUEUE))
    queueEvents = new QueueEvents(PERSISTENCE_QUEUE, {
      connection: queue.opts.connection,
    })
    messageService = app.get<MessageService>(MessageService)
    roomService = app.get<RoomService>(RoomService)
    redis = app.get<Redis>(RedisToken)

    redisSubscriber = new Redis(queue.opts.connection as RedisOptions)
    await redisSubscriber.subscribe(MESSAGE_PERSISTED_EVENT)
  }

  beforeAll(async () => {
    seedData = await seed()
  })

  const teardownApp = async () => {
    if (redisSubscriber) {
      await redisSubscriber.quit()
    }
    if (queueEvents) await queueEvents.close()
    if (queue) await queue.close()
    if (app) await app.close()
  }

  describe('Message persistence', () => {
    beforeAll(async () => {
      await setupApp('write-behind')
    })

    afterEach(async () => {
      await queue.obliterate({ force: true })
    })

    afterAll(async () => {
      await teardownApp()
    })

    it('should process a persist job, save the message, and emit an event to Redis', async () => {
    const room = seedData.rooms.find((r) => r.name === 'General')!
    const user = seedData.users[0]

    const messagePayload = {
      messageId: v7(),
      clientMsgId: v7(),
      roomId: room.roomId,
      userId: user.userId,
      content: 'Hello from a valid e2e test!',
      createdAt: new Date(),
    }

    const eventPromise = new Promise<void>((resolve) => {
      redisSubscriber.on('message', (channel, message) => {
        if (channel === MESSAGE_PERSISTED_EVENT) {
          try {
            const parsed = JSON.parse(message)
            if (parsed && parsed.data && parsed.data.messageId === messagePayload.messageId) {
              resolve()
            }
          } catch (e) {
            console.log(e)
          }
        }
      })
    })

    await queue.add(PERSIST_MESSAGE_JOB, messagePayload)

    await Promise.all([
      vi.waitFor(
        async () => {
          const savedMessages = await messageService.getRoomHistory(room.roomId, 20, {})
          const a = savedMessages.find((m) => m.messageId === messagePayload.messageId)
          expect(a).toBeDefined()
          expect(a?.content).toBe(messagePayload.content)
        },
        { timeout: 5000, interval: 200 },
      ),
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Redis event not received')), 5000)
        void eventPromise.then(() => {
          clearTimeout(timeout)
          resolve()
        })
      }),
    ])
    })

    it('should not persist a message if user is not in the room', async () => {
    const room = seedData.rooms.find((r) => r.name === 'Restricted Room')!
    const user = seedData.users[0]
    const initialHistory = await messageService.getRoomHistory(room.roomId, 20, {})

    const messagePayload: BaseMessage = {
      messageId: v7(),
      clientMsgId: v7(),
      roomId: room.roomId,
      userId: user.userId,
      content: 'This message should be discarded.',
      createdAt: new Date(),
    }

    const job = await queue.add(PERSIST_MESSAGE_JOB, messagePayload)

    await expect(job.waitUntilFinished(queueEvents)).rejects.toThrow()

    const isFailed = await job.isFailed()
    expect(isFailed).toBe(true)

    const finalHistory = await messageService.getRoomHistory(room.roomId, 20, {})
    expect(finalHistory.length).toBe(initialHistory.length)
    })
  })

  describe.each([
    { mode: 'write-behind' as const },
    { mode: 'direct' as const },
  ])('Last-read persistence with $mode mode', ({ mode }) => {
    beforeAll(async () => {
      await setupApp(mode)
    })

    afterEach(async () => {
      await queue.obliterate({ force: true })
    })

    afterAll(async () => {
      await teardownApp()
    })

    it.skipIf(mode !== 'write-behind')('should sync dirty last-read cursors from Redis to PostgreSQL', async () => {
    const room = seedData.rooms.find((r) => r.name === 'General')!
    const user = seedData.users[0]
    const message = seedData.messages.find((m) => m.roomId === room.roomId)!

    const cacheKey = cacheKeyLastRead(room.roomId, user.userId)
    await redis.set(cacheKey, message.messageId)
    await redis.sadd(CACHE_KEY_LAST_READ_DIRTY, `${room.roomId}:${user.userId}`)

    const job = await queue.add(SYNC_LAST_READ_JOB, {})
    await job.waitUntilFinished(queueEvents, 5000)

    const rooms = await roomService.findRoomsByUserId(user.userId)
    const general = rooms.find((r) => r.roomId === room.roomId)!
    expect(general.lastReadMessageId).toBe(message.messageId)

    const dirtyMembers = await redis.smembers(CACHE_KEY_LAST_READ_DIRTY)
    expect(dirtyMembers).not.toContain(`${room.roomId}:${user.userId}`)

    const cachedValue = await redis.get(cacheKey)
    expect(cachedValue).toBeNull()
    })

    it.skipIf(mode !== 'direct')('should not schedule sync job when using direct mode', async () => {
      const [waiting, delayed, active] = await Promise.all([
        queue.getWaiting(),
        queue.getDelayed(),
        queue.getActive(),
      ])

      const syncJobExists = [...waiting, ...delayed, ...active].some(
        job => job.name === SYNC_LAST_READ_JOB,
      )

      expect(syncJobExists).toBe(false)
    })
  })
})
