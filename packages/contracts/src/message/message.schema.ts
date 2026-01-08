import { messages } from '@chatbox/persistence/schema'
import { createSelectSchema } from 'drizzle-zod'
import z from 'zod'

const RawMessageSchema = createSelectSchema(messages)
export const BaseMessageSchema = RawMessageSchema.extend({
  createdAt: z.coerce.date(),
})

export type BaseMessage = z.infer<typeof BaseMessageSchema>

export const HistoryMessageSchema = BaseMessageSchema
export type HistoryMessage = z.infer<typeof HistoryMessageSchema>

export const MsgSendSchema = BaseMessageSchema.pick({
  content: true,
  roomId: true,
  clientMsgId: true,
})
export const MsgReceivedSchema = BaseMessageSchema

export const PostMessageSchema = BaseMessageSchema.pick({ content: true }).extend({
  clientMsgId: z.uuidv7(),
})
export const PostMessageResponseSchema = BaseMessageSchema.pick({
  content: true,
  messageId: true,
  clientMsgId: true,
})
