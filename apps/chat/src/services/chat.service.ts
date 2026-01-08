import { PERSIST_MESSAGE_JOB, PERSISTENCE_QUEUE } from '@chatbox/contracts'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Optional } from '@nestjs/common'
import { Queue } from 'bullmq'
import { v7 } from 'uuid'
import { ChatMetricsService } from '../metrics/chat-metrics.service'

@Injectable()
export class ChatService {
  constructor(
    @InjectQueue(PERSISTENCE_QUEUE) private readonly persistenceQueue: Queue,
    @Optional() private readonly metrics: ChatMetricsService,
  ) {}

  async postMessage(roomId: string, userId: string, content: string, clientMsgId: string) {
    const messageId = v7()
    const payload = {
      messageId,
      roomId,
      userId,
      content,
      clientMsgId,
      createdAt: new Date(),
    }

    await this.persistenceQueue.add(PERSIST_MESSAGE_JOB, payload)
    this.metrics?.onJobAdded(PERSISTENCE_QUEUE, PERSIST_MESSAGE_JOB)

    return payload
  }
}
