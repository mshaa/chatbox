import { chatQueries } from '@/lib/queries/factory'
import { useAuthStore } from '@/stores/auth.store'
import { RoomMemberWithStatus } from '@chatbox/contracts'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

export type RoomMembersTransformer<T> = (data: RoomMemberWithStatus[]) => T

export const useRoomMembers = <T = RoomMemberWithStatus[]>(
  roomId: string,
  select?: RoomMembersTransformer<T>,
) => {
  return useQuery({
    ...chatQueries['rooms.members'](roomId),
    select,
    enabled: !!roomId,
  })
}

export const useSuspenseRoomMembers = <T = RoomMemberWithStatus[]>(
  roomId: string,
  select?: RoomMembersTransformer<T>,
) => {
  return useSuspenseQuery({
    ...chatQueries['rooms.members'](roomId),
    select
  })
}
