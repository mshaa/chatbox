import { chatQueries } from '@/lib/queries/factory'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

export const useRoomHistory = (roomId: string, initialAnchor?: string | null) => {
  return useSuspenseInfiniteQuery({
    ...chatQueries['rooms.history'](roomId, initialAnchor)
  })
}
