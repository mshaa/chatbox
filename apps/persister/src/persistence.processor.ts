import {
  BaseMessage,
  CACHE_KEY_LAST_READ_DIRTY,
  cacheKeyLastRead,
  MESSAGE_PERSISTED_EVENT,
  parseLastReadDirtyEntry,
  PERSIST_MESSAGE_JOB,
  PERSISTENCE_QUEUE,
  PersistMessageJobSchema,
  SYNC_LAST_READ_JOB,
} from '@chatbox/contracts'
import { queueConfig, type QueueConfig, RedisToken } from '@chatbox/nest-infra'
import { MessageService, RoomService } from '@chatbox/nest-persistence'
import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger, Optional } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { Job, Queue } from 'bullmq'
import type Redis from 'ioredis'
import { PersisterMetricsService } from './metrics/persister-metrics.service'

@Processor(PERSISTENCE_QUEUE)
export class PersistenceProcessor extends WorkerHost {
  private readonly logger = new Logger(PersistenceProcessor.name)

  constructor(
    private readonly messageService: MessageService,
    private readonly roomService: RoomService,
    @Inject('TRANSPORT_CLIENT') private readonly chatClient: ClientProxy,
    @Inject(RedisToken) private readonly redis: Redis,
    @InjectQueue(PERSISTENCE_QUEUE) private readonly queue: Queue,
    @Inject(queueConfig.KEY) private readonly config: QueueConfig,
    @Optional() private readonly metrics: PersisterMetricsService,
  ) {
    super()
  }

  async process(job: Job<BaseMessage>) {
    const endTimer = this.metrics?.startJobTimer(PERSISTENCE_QUEUE, job.name)
    this.logger.debug({ job: { id: job.id, name: job.name, data: job.data } }, 'Processing job')
    try {
      switch (job.name) {
        case PERSIST_MESSAGE_JOB:
          await this.handlePersistMessage(job)
          break
        case SYNC_LAST_READ_JOB:
          await this.handleSyncLastRead(job)
          break
        default:
          throw new Error(`Unknown job name: ${job.name}`)
      }
    } finally {
      endTimer?.()
    }
  }

  private async handlePersistMessage(job: Job) {
    const message = PersistMessageJobSchema.parse(job.data)
    await this.messageService.createMessage(message)
    this.chatClient.emit(MESSAGE_PERSISTED_EVENT, message)
    this.metrics.onMessagePersisted()
  }

  private async handleSyncLastRead(job: Job) {
    try {
      const dirtyPairs = await this.redis.smembers(CACHE_KEY_LAST_READ_DIRTY)
      if (dirtyPairs.length === 0) {
        return
      }

      await this.redis.del(CACHE_KEY_LAST_READ_DIRTY)

      const entries: { userId: string; roomId: string; messageId: string }[] = []
      const keysToDelete: string[] = []

      for (const pair of dirtyPairs) {
        const { roomId, userId } = parseLastReadDirtyEntry(pair)
        const key = cacheKeyLastRead(roomId, userId)
        const messageId = await this.redis.get(key)
        if (messageId) {
          entries.push({ userId, roomId, messageId })
          keysToDelete.push(key)
        }
      }

      if (entries.length > 0) {
        await this.roomService.batchUpdateLastRead(entries)
        this.logger.debug({ count: entries.length }, 'Synced last-read cursors to database')
      }

      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete)
      }
    } finally {
      await this.queue.add(
        SYNC_LAST_READ_JOB,
        {},
        {
          delay: this.config.jobSyncLastReadIntervalMs,
          removeOnComplete: true,
          removeOnFail: true,
        },
      )
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.debug({ jobId: job.id, jobName: job.name, returnvalue: result }, 'Job completed')
    this.metrics?.onJobCompleted(PERSISTENCE_QUEUE, job.name)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error({ jobId: job.id, jobName: job.name, err: err.message }, 'Job failed')
    this.metrics?.onJobFailed(PERSISTENCE_QUEUE, job.name)
  }
}
