import { queueConfig, type QueueConfig } from '../config/config'
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common'
import Redis from 'ioredis'

export const RedisToken: unique symbol = Symbol('REDIS_CLIENT')

@Injectable()
export class RedisService implements OnApplicationShutdown {
  public readonly client: Redis

  constructor(@Inject(queueConfig.KEY) config: QueueConfig) {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      lazyConnect: true,
    })
  }

  async onApplicationShutdown() {
    await this.client.quit()
  }
}

export const RedisProvider = {
  provide: RedisToken,
  useFactory: (redisService: RedisService) => redisService.client,
  inject: [RedisService],
}
