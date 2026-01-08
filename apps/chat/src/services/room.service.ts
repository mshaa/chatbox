import {
  CACHE_KEY_LAST_READ_DIRTY,
  CACHE_KEY_ROOMS_DISCOVER,
  cacheKeyLastRead,
  cacheKeyRoomMembers,
} from '@chatbox/contracts'
import { type QueueConfig, RedisToken, queueConfig } from '@chatbox/nest-infra'
import {
  MessageService as MessagePersistance,
  RoomService as RoomPersistance,
  UserService as UserPersistance,
} from '@chatbox/nest-persistence'
import { generateDmName, generateDmSlug } from '@chatbox/persistence/tools'
import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common'
import type Redis from 'ioredis'
import { v7 } from 'uuid'
import { ChatGateway } from '../gateway/chat.gateway'
import { ChatMetricsService } from '../metrics/chat-metrics.service'

@Injectable()
export class RoomService {
  constructor(
    private readonly roomPersistance: RoomPersistance,
    private readonly messagePersistance: MessagePersistance,
    private readonly userPersistance: UserPersistance,
    private readonly chatGateway: ChatGateway,
    @Inject(RedisToken) private readonly redis: Redis,
    @Inject(queueConfig.KEY) private readonly config: QueueConfig,
    @Optional() private readonly metrics: ChatMetricsService,
  ) { }

  async createRoomGroup(room: { name: string }) {
    const slug = room.name.toLowerCase().replace(/\s+/g, '-')
    const newRoom = await this.roomPersistance.createRoomGroup({
      name: room.name,
      slug,
      type: 'group',
      roomId: v7(),
      createdAt: new Date(),
    })

    await this.redis.del(CACHE_KEY_ROOMS_DISCOVER)

    this.chatGateway.emitRoomGroupCreated(newRoom)
    this.metrics?.onRoomCreated('group')
    return newRoom
  }

  async createRoomDm(creatorId: string, targetUserId: string) {
    const slug = generateDmSlug(creatorId, targetUserId)

    const [creator, target] = await Promise.all([
      this.userPersistance.findUserById(creatorId),
      this.userPersistance.findUserById(targetUserId),
    ])

    if (!creator || !target) {
      throw new NotFoundException(`Could not resolve creator: ${creator?.userId}, target: ${target?.userId}`)
    }

    const name = generateDmName(creator.username, target.username)

    const roomData = {
      roomId: v7(),
      name,
      slug,
      type: 'dm' as const,
      createdAt: new Date(),
    }

    const room = await this.roomPersistance.createRoomDm(roomData, [creatorId, targetUserId])

    await this.chatGateway.addUserToRoomSilent(room.roomId, creatorId)

    this.chatGateway.emitRoomDmCreated(targetUserId, room)
    this.metrics?.onRoomCreated('dm')

    return room
  }

  async getRoomHistory(roomId: string, limit: number, options: { cursor?: string; anchor?: string; direction?: 'prev' | 'next' }) {
    return this.messagePersistance.getRoomHistory(roomId, limit, options)
  }

  async getRoomMembers(roomId: string) {
    const cacheKey = cacheKeyRoomMembers(roomId)
    let members: { userId: string; username: string; avatar: string | null }[]

    const cached = await this.redis.get(cacheKey)
    if (cached) {
      members = JSON.parse(cached)
    } else {
      const users = await this.roomPersistance.findUsersByRoomId(roomId)
      members = users.map((roomUser) => ({
        userId: roomUser.user.userId,
        username: roomUser.user.username,
        avatar: roomUser.user.avatar,
      }))
      await this.redis.set(cacheKey, JSON.stringify(members), 'EX', this.config.cacheTtl.roomMembers)
    }

    const onlineUserIds = await this.chatGateway.getOnlineUserIdsInRoom(roomId)

    return members.map((member) => ({
      ...member,
      isOnline: onlineUserIds.has(member.userId),
    }))
  }

  async findDiscoverableRooms() {
    const cached = await this.redis.get(CACHE_KEY_ROOMS_DISCOVER)
    if (cached) return JSON.parse(cached)

    const rooms = await this.roomPersistance.findDiscoverableRooms()
    await this.redis.set(CACHE_KEY_ROOMS_DISCOVER, JSON.stringify(rooms), 'EX', this.config.cacheTtl.roomsDiscover)
    return rooms
  }

  async joinRoom(roomId: string, userId: string) {
    await this.roomPersistance.joinRoom(roomId, userId)
    await this.chatGateway.addUserToRoom(roomId, userId)

    await this.redis.del(CACHE_KEY_ROOMS_DISCOVER, cacheKeyRoomMembers(roomId))
    this.metrics?.onRoomJoin()
  }

  async leaveRoom(roomId: string, userId: string) {
    await this.roomPersistance.leaveRoom(roomId, userId)
    await this.chatGateway.removeUserFromRoom(roomId, userId)

    await this.redis.del(CACHE_KEY_ROOMS_DISCOVER, cacheKeyRoomMembers(roomId))
    this.metrics?.onRoomLeave()
  }

  async updateLastRead(userId: string, roomId: string, messageId: string) {
    if (this.config.persistReadMsgId === 'direct') {
      await this.roomPersistance.batchUpdateLastRead([{ userId, roomId, messageId }])
    } else {
      await this.redis.set(cacheKeyLastRead(roomId, userId), messageId)
      await this.redis.sadd(CACHE_KEY_LAST_READ_DIRTY, `${roomId}:${userId}`)
    }
  }
}
