import { z } from 'zod'
import { BaseMessageSchema } from '../message'

export const PersistMessageJobSchema = BaseMessageSchema

export const SyncLastReadEntrySchema = z.object({
  userId: z.string(),
  roomId: z.string(),
  messageId: z.string(),
})
