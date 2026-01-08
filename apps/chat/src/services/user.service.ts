import { cacheKeyUserProfile } from '@chatbox/contracts'
import { type QueueConfig, RedisToken, queueConfig } from '@chatbox/nest-infra'
import {
    RoomService as RoomPersistence,
    UserService as UserPersistence,
} from '@chatbox/nest-persistence'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type Redis from 'ioredis'

@Injectable()
export class UserService {
  constructor(
    private readonly roomPersistence: RoomPersistence,
    private readonly userPersistence: UserPersistence,
    @Inject(RedisToken) private readonly redis: Redis,
    @Inject(queueConfig.KEY) private readonly config: QueueConfig,
  ) {}

  async getUserChats(userId: string) {
    const rooms = await this.roomPersistence.findRoomsByUserId(userId)
    return rooms
  }

  async getUserProfile(userId: string) {
    const cached = await this.redis.get(cacheKeyUserProfile(userId))
    if (cached) return JSON.parse(cached)

    const user = await this.userPersistence.findUserById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    const profile = {
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
    }
    await this.redis.set(cacheKeyUserProfile(userId), JSON.stringify(profile), 'EX', this.config.cacheTtl.userProfile)
    return profile
  }
}
