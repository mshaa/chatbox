import { rooms, users } from '@chatbox/persistence/schema'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const BaseUserFullSchema = createSelectSchema(users)
export type BaseUserFull = z.infer<typeof BaseUserFullSchema>

export const BaseUserSchema = BaseUserFullSchema.pick({
  userId: true,
  username: true,
  avatar: true,
})
export type BaseUser = z.infer<typeof BaseUserSchema>

export const SignUpSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters long'),
})
export type SignUp = z.infer<typeof SignUpSchema>

export const SignInSchema = SignUpSchema
export type SignIn = SignUp

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().uuid().optional(),
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().uuid(),
})
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().uuid(),
})
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>

export const SocketTokenResponseSchema = z.object({
  socketToken: z.string(),
})
export type SocketTokenResponse = z.infer<typeof SocketTokenResponseSchema>

export const UserChatSchema = createSelectSchema(rooms)
  .pick({
    roomId: true,
    name: true,
    type: true,
    slug: true,
  })
  .extend({
    unreadCount: z.number().default(0),
    lastReadMessageId: z.string().uuid().nullish(),
  })

export type UserChat = z.infer<typeof UserChatSchema>

export const UserChatsSchema = z.array(UserChatSchema)
export type UserChats = z.infer<typeof UserChatsSchema>
