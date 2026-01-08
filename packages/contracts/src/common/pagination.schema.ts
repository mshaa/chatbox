import { z } from 'zod'

export const CursorPaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100),
  cursor: z.string().uuid().optional(),
  anchor: z.string().uuid().optional(), 
  direction: z.enum(['prev', 'next']).default('prev'), 
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    prevCursor: z.string().nullish(), 
    nextCursor: z.string().nullish(),
  })

export type CursorPagination = z.input<typeof CursorPaginationSchema>
export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<z.ZodType<T>>>>
