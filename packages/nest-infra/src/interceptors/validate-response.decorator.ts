import { SetMetadata } from '@nestjs/common'
import { z } from 'zod'

export const RESPONSE_SCHEMA_KEY = 'responseSchema'

/**
 * Decorator to validate controller response data with Zod before sending to client
 * Works in conjunction with TransformInterceptor to ensure type safety
 *
 * @param schema - Zod schema to validate the response data
 *
 * @example
 * @ValidateResponse(UserChatsSchema)
 * @Get('users/me/chats')
 * getUserChats() {
 *   return [...];
 * }
 */
export const ValidateResponse = (schema: z.ZodTypeAny) => SetMetadata(RESPONSE_SCHEMA_KEY, schema)
