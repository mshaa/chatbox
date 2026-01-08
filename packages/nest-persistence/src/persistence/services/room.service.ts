import { BaseRoom } from '@chatbox/contracts'
import * as schema from '@chatbox/persistence/schema'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, count, eq, sql } from 'drizzle-orm'
import { NIL } from 'uuid'
import { type DrizzleDatabase, DrizzleProviderToken } from '../providers/drizzle.provider'

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name)

  constructor(@Inject(DrizzleProviderToken) private readonly db: DrizzleDatabase) {}

  async createRoomGroup(newRoom: BaseRoom): Promise<BaseRoom> {
    this.logger.debug({ room: newRoom }, 'Creating new room')
    const r = await this.db
      .insert(schema.rooms)
      .values({ ...newRoom })
      .returning()
    this.logger.debug({ roomId: r[0].roomId }, 'Room created')
    return r[0]
  }

  async createRoomDm(room: BaseRoom, memberIds: string[]): Promise<BaseRoom> {
    this.logger.debug({ slug: room.slug }, 'Creating DM room')

    return await this.db.transaction(async (tx) => {
      const rows = await tx.insert(schema.rooms).values(room).returning()

      const actualRoom = rows[0]

      if (memberIds.length > 0) {
        await tx.insert(schema.roomUsers).values(
          memberIds.map((userId) => ({
            roomId: actualRoom.roomId,
            userId,
          })),
        )
      }

      return actualRoom
    })
  }

  async findRoomById(roomId: string): Promise<BaseRoom | undefined> {
    this.logger.debug({ roomId }, 'Finding room by ID')
    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.roomId, roomId),
    })
    this.logger.debug({ roomId, found: !!room }, 'Room search complete')
    return room
  }

  async findRoomsByUserId(userId: string) {
    this.logger.debug({ userId }, 'Finding rooms for user with unread counts')

    const rooms = await this.db
      .select({
        roomId: schema.rooms.roomId,
        name: schema.rooms.name,
        slug: schema.rooms.slug,
        type: schema.rooms.type,
        lastReadMessageId: schema.roomUsers.lastReadMessageId,
        unreadCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${schema.messages}
          WHERE ${schema.messages.roomId} = ${schema.rooms.roomId}
            AND ${schema.messages.messageId} > COALESCE(${schema.roomUsers.lastReadMessageId}, ${NIL})
            AND ${schema.messages.userId} != ${userId}
        )`,
      })
      .from(schema.roomUsers)
      .where(eq(schema.roomUsers.userId, userId))
      .innerJoin(schema.rooms, eq(schema.rooms.roomId, schema.roomUsers.roomId))

    return rooms
  }

  async findDiscoverableRooms() {
    this.logger.debug('Finding discoverable rooms')
    const rooms = await this.db
      .select({
        roomId: schema.rooms.roomId,
        name: schema.rooms.name,
        slug: schema.rooms.slug,
        type: schema.rooms.type,
        memberCount: count(schema.roomUsers.userId),
      })
      .from(schema.rooms)
      .where(eq(schema.rooms.type, 'group'))
      .leftJoin(schema.roomUsers, eq(schema.rooms.roomId, schema.roomUsers.roomId))
      .groupBy(schema.rooms.roomId, schema.rooms.name, schema.rooms.slug, schema.rooms.type)

    this.logger.debug({ count: rooms.length }, 'Discoverable rooms retrieved')

    return rooms.map((room) => ({
      ...room,
      memberCount: parseInt(room.memberCount as unknown as string, 10),
    }))
  }

  async findUsersByRoomId(roomId: string) {
    this.logger.debug('Finding rooms users')
    const users = await this.db.query.roomUsers.findMany({
      where: eq(schema.roomUsers.roomId, roomId),
      with: {
        user: true,
      },
    })
    this.logger.debug({ count: users.length }, 'Room users retrieved')
    return users
  }

  async joinRoom(roomId: string, userId: string) {
    this.logger.debug({ roomId, userId }, 'Joining user to room')
    await this.db.insert(schema.roomUsers).values({ roomId, userId }).onConflictDoNothing() // Prevent duplicate entries if user already in room
    this.logger.debug({ roomId, userId }, 'User joined room')
  }

  async leaveRoom(roomId: string, userId: string) {
    this.logger.debug({ roomId, userId }, 'Removing user from room')
    await this.db
      .delete(schema.roomUsers)
      .where(and(eq(schema.roomUsers.roomId, roomId), eq(schema.roomUsers.userId, userId)))
    this.logger.debug({ roomId, userId }, 'User removed from room')
  }

  async batchUpdateLastRead(entries: { userId: string; roomId: string; messageId: string }[]) {
    if (entries.length === 0) return

    this.logger.debug({ count: entries.length }, 'Batch updating last read messages')

    const valueRows = entries.map(
      ({ userId, roomId, messageId }) =>
        sql`(${userId}::uuid, ${roomId}::uuid, ${messageId}::uuid)`,
    )

    await this.db.execute(sql`
      UPDATE room_users AS ru
      SET last_read_message_id = v.message_id
      FROM (VALUES ${sql.join(valueRows, sql`, `)}) AS v(user_id, room_id, message_id)
      WHERE ru.user_id = v.user_id
        AND ru.room_id = v.room_id
        AND (
          ru.last_read_message_id IS NULL
          OR v.message_id > ru.last_read_message_id
        )
    `)

    this.logger.debug({ count: entries.length }, 'Batch update complete')
  }
}
