import { SuccessResponse, SuccessResponseSchema } from '@chatbox/contracts'
import { z } from 'zod'

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'FetchError'
  }
}

export async function fetchJson<T extends z.ZodType>(
  url: string,
  schema: T,
  options?: RequestInit & {
    unwrapSuccess?: boolean
  },
): Promise<z.infer<T>> {
  const { unwrapSuccess = false, ...fetchOptions } = options || {}

  const headers = new Headers(fetchOptions?.headers)

  if (fetchOptions?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new FetchError(error.error || `Request failed: ${res.statusText}`, res.status)
  }

  const json = await res.json()

  const schemaToValidate = unwrapSuccess ? SuccessResponseSchema(schema) : schema
  const parseResult = schemaToValidate.safeParse(json)

  if (!parseResult.success) {
    console.error('Response validation failed:', {
      url,
      errors: parseResult.error,
    })
    throw new Error(`Invalid response format from ${url}`)
  }

  if (unwrapSuccess) {
    const successResponse = parseResult.data as SuccessResponse<z.infer<T>>
    return successResponse.data
  }

  return parseResult.data as z.infer<T>
}
