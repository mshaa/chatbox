import { rooms } from '@chatbox/persistence/schema'
import { createSelectSchema } from 'drizzle-zod'
import z from 'zod'
import { BaseUserSchema } from '../user'

/**
 * Base Room Schema from Database
 */
export const BaseRoomSchema = createSelectSchema(rooms).extend({
  createdAt: z.coerce.date(),
})
export type BaseRoom = z.infer<typeof BaseRoomSchema>

/**
 * Room Actions
 */
export const CreateRoomGroupSchema = BaseRoomSchema.pick({ name: true })
export type CreateRoomGroup = z.infer<typeof CreateRoomGroupSchema>

export const CreateRoomDmSchema = z.object({
  targetUserId: z.string().uuid(),
  content: z.string(),
  clientMsgId: z.string().uuid()
})
export type CreateRoomDm = z.infer<typeof CreateRoomDmSchema>

export const RoomCreatedSchema = BaseRoomSchema
export type RoomCreated = z.infer<typeof RoomCreatedSchema>

/**
 * Typing Events
 */
export const TypingStartSchema = BaseRoomSchema.pick({ roomId: true })
export type TypingStart = z.infer<typeof TypingStartSchema>

export const TypingStopSchema = BaseRoomSchema.pick({ roomId: true })
export type TypingStop = z.infer<typeof TypingStopSchema>

/**
 * Participation Events
 */
export const RoomJoinSchema = BaseRoomSchema.pick({ roomId: true })
export type RoomJoin = z.infer<typeof RoomJoinSchema>

export const RoomLeaveSchema = BaseRoomSchema.pick({ roomId: true })
export type RoomLeave = z.infer<typeof RoomLeaveSchema>

/**
 * Discover rooms
 */
export const DiscoverRoomSchema = BaseRoomSchema.pick({
  roomId: true,
  name: true,
  type: true,
  slug: true,
}).extend({
  memberCount: z.number(),
})
export type DiscoverRoom = z.infer<typeof DiscoverRoomSchema>

export const DiscoverRoomsSchema = z.array(DiscoverRoomSchema)
export type DiscoverRooms = z.infer<typeof DiscoverRoomsSchema>

/**
 * Detailed Presence & Activity
 */
export const UserTypingCompactSchema = z.object({
  roomId: z.string(),
  isTyping: z.boolean(),
})
export type UserTypingCompact = z.infer<typeof UserTypingCompactSchema>

export const UserTypingSchema = z.object({
  userId: z.string(),
  username: z.string(),
  roomId: z.string(),
  isTyping: z.boolean(),
})
export type UserTyping = z.infer<typeof UserTypingSchema>

export const UserJoinedSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
})
export type UserJoined = z.infer<typeof UserJoinedSchema>

export const UserLeftSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
})
export type UserLeft = z.infer<typeof UserLeftSchema>

export const ReadRoomSchema = z.object({
  messageId: z.string(),
})
export type ReadRoom = z.infer<typeof ReadRoomSchema>

export const UserStatusSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
})
export type UserStatus = z.infer<typeof UserStatusSchema>

export const RoomMemberSchema = BaseUserSchema
export type RoomMember = z.infer<typeof RoomMemberSchema>

export const RoomMemberWithStatusSchema = BaseUserSchema.extend({
  isOnline: z.boolean(),
})
export type RoomMemberWithStatus = z.infer<typeof RoomMemberWithStatusSchema>

export const RoomMembersCompactSchema = z.array(
  z.object({
    userId: z.string(),
  }),
)
export type RoomMembersCompact = z.infer<typeof RoomMembersCompactSchema>
