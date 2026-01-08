import { relations } from 'drizzle-orm'
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

// Enums

export const roomTypeEnum = pgEnum('room_type', ['dm', 'group'])

// Tables

export const users = pgTable('users', {
  userId: uuid('user_id').primaryKey(), 
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const rooms = pgTable('rooms', {
  roomId: uuid('room_id').primaryKey(), 
  name: text('name').notNull(),
  slug: text('slug').unique(),
  type: roomTypeEnum('type').notNull().default('group'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable(
  'messages',
  {
    messageId: uuid('message_id').primaryKey(),
    clientMsgId: uuid('client_msg_id').notNull(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.roomId, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roomHistoryIndex: index('idx_room_messages_v7').on(table.roomId, table.messageId),
    clientMsgIdIndex: uniqueIndex('idx_messages_client_msg_id').on(table.roomId, table.clientMsgId),
    messageRoomUnique: unique('idx_messages_message_room_unique').on(table.messageId, table.roomId),
  }),
)

export const roomUsers = pgTable(
  'room_users',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.roomId, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    lastReadMessageId: uuid('last_read_message_id'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roomId] }),
    roomIdx: index('idx_room_users_room_id').on(table.roomId),
    consistentLastReadFk: foreignKey({
      columns: [table.lastReadMessageId, table.roomId],
      foreignColumns: [messages.messageId, messages.roomId],
    }).onDelete('set null'),
  }),
)

// Relations

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  rooms: many(roomUsers),
}))

export const roomsRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
  users: many(roomUsers),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.userId] }),
  room: one(rooms, { fields: [messages.roomId], references: [rooms.roomId] }),
}))

export const roomUsersRelations = relations(roomUsers, ({ one }) => ({
  user: one(users, { fields: [roomUsers.userId], references: [users.userId] }),
  room: one(rooms, { fields: [roomUsers.roomId], references: [rooms.roomId] }),
}))
