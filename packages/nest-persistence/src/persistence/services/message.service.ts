import { BaseMessage } from '@chatbox/contracts'
import * as schema from '@chatbox/persistence/schema'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, asc, desc, eq, gte, gt, lt, sql } from 'drizzle-orm'
import { type DrizzleDatabase, DrizzleProviderToken } from '../providers/drizzle.provider'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  constructor(@Inject(DrizzleProviderToken) private readonly db: DrizzleDatabase) {}

  // @todo: enforce check user has joined the room
  async createMessage(newMessage: BaseMessage): Promise<BaseMessage> {
    const query = sql`
      INSERT INTO ${schema.messages}
        (message_id, client_msg_id, room_id, user_id, content)
      SELECT
        ${newMessage.messageId}::uuid,
        ${newMessage.clientMsgId}::uuid,
        ${newMessage.roomId}::uuid,
        ${newMessage.userId}::uuid,
        ${newMessage.content}
      FROM ${schema.roomUsers}
      WHERE ${schema.roomUsers.userId} = ${newMessage.userId}
        AND ${schema.roomUsers.roomId} = ${newMessage.roomId}
      RETURNING *
    `

    const r = await this.db.execute(query)

    if (r.length === 0) {
      throw new Error('User is not a member of this room')
    }

    return r[0] as unknown as BaseMessage
  }

  async getRoomHistory(
    roomId: string,
    limit: number,
    options: { cursor?: string; anchor?: string; direction?: 'prev' | 'next' },
  ) {
    const { cursor, anchor, direction = 'prev' } = options
    this.logger.debug({ roomId, limit, cursor, anchor, direction }, 'Getting room history')

    if (anchor && !cursor) {
      const half = Math.ceil(limit / 2)

      const [beforeAnchor, fromAnchor] = await Promise.all([
        this.db.query.messages.findMany({
          where: and(
            eq(schema.messages.roomId, roomId),
            lt(schema.messages.messageId, anchor),
          ),
          orderBy: [desc(schema.messages.messageId)],
          limit: half + 1,
        }),
        this.db.query.messages.findMany({
          where: and(
            eq(schema.messages.roomId, roomId),
            gte(schema.messages.messageId, anchor),
          ),
          orderBy: [asc(schema.messages.messageId)],
          limit: half + 1,
        }),
      ])

      return [...beforeAnchor, ...fromAnchor].sort((a, b) =>
        a.messageId.localeCompare(b.messageId),
      )
    }

    return this.db.query.messages.findMany({
      where: and(
        eq(schema.messages.roomId, roomId),
        cursor
          ? direction === 'next' ? gt(schema.messages.messageId, cursor) : lt(schema.messages.messageId, cursor)
          : undefined,
      ),
      orderBy: [direction === 'next' ? asc(schema.messages.messageId) : desc(schema.messages.messageId)],
      limit: limit + 1,
    })
  }
}
