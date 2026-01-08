import z from 'zod'

export const SocketNotAuthedSchema = z.object({
  message: z.string().optional(),
})
