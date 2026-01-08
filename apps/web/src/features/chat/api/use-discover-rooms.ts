import { chatQueries } from '@/lib/queries/factory'
import { DiscoverRooms } from '@chatbox/contracts'
import { useSuspenseQuery } from '@tanstack/react-query'

export type DiscoverRoomsTransformer<T> = (data: DiscoverRooms) => T

export const useDiscoverRooms = <T = DiscoverRooms>(select?: DiscoverRoomsTransformer<T>) => {
  return useSuspenseQuery({
    ...chatQueries['rooms.discover'],
    select,
  })
}
