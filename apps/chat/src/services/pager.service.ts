import { PaginatedResponse } from '@chatbox/contracts'
import { Injectable } from '@nestjs/common'

type PaginateOptions<T> = {
  limit: number
  cursor?: string | null
  anchor?: string | null
  direction?: 'prev' | 'next' | null
  getCursor: (item: T) => string
}

@Injectable()
export class PagerService {
  // @issue: hardcoded to ASC order
  paginate<T>(
    items: T[],
    { limit, cursor, anchor, direction, getCursor }: PaginateOptions<T>,
  ): PaginatedResponse<T> {
    if (anchor && !cursor) {
      const half = Math.ceil(limit / 2)
      const anchorIdx = items.findIndex((item) => getCursor(item) >= anchor)
      const before = anchorIdx >= 0 ? items.slice(0, anchorIdx) : items
      const fromAnchor = anchorIdx >= 0 ? items.slice(anchorIdx) : []

      const hasPrev = before.length > half
      const hasNext = fromAnchor.length > half
      const trimmedBefore = hasPrev ? before.slice(before.length - half) : before
      const trimmedAfter = hasNext ? fromAnchor.slice(0, half) : fromAnchor
      const result = [...trimmedBefore, ...trimmedAfter]

      return {
        items: result,
        prevCursor: hasPrev && result.length > 0 ? getCursor(result[0]) : null,
        nextCursor: hasNext && result.length > 0 ? getCursor(result[result.length - 1]) : null,
      }
    }

    if (direction === 'next') {
      const hasNext = items.length > limit
      const result = hasNext ? items.slice(0, limit) : items
      return {
        items: result,
        prevCursor: cursor && result.length > 0 ? getCursor(result[0]) : null,
        nextCursor: hasNext && result.length > 0 ? getCursor(result[result.length - 1]) : null,
      }
    }

    const hasPrev = items.length > limit
    const result = hasPrev ? items.slice(0, limit) : items
    result.reverse()
    return {
      items: result,
      prevCursor: hasPrev && result.length > 0 ? getCursor(result[0]) : null,
      nextCursor: cursor && result.length > 0 ? getCursor(result[result.length - 1]) : null,
    }
  }
}
