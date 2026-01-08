import { z } from 'zod'

/**
 * Success Response Wrapper
 * Wraps all successful HTTP responses from the API
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    statusCode: z.number(),
    data: dataSchema,
    timestamp: z.string().datetime(),
  })

export type SuccessResponse<T> = {
  success: true
  statusCode: number
  data: T
  timestamp: string
}

/**
 * Error Response Wrapper
 * Wraps all error responses (validation errors, exceptions, etc.)
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  payload: z.object({
    message: z.union([z.string(), z.array(z.string())]),
    errorCode: z.string().optional(),
  }),
  path: z.string(),
  timestamp: z.string().datetime(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
