import { chatQueries } from '@/lib/queries/factory'
import { useAuthStore } from '@/stores/auth.store'
import { BaseUser, RoomMemberWithStatus } from '@chatbox/contracts'
import { useQueryClient, useQuery } from '@tanstack/react-query'

export const useUserById = (userId: string | null) => {
  const queryClient = useQueryClient()

  return useQuery({
    ...chatQueries['users.byId'](userId || ''),
    enabled: !!userId,
    initialData: (): BaseUser | undefined => {
      if (!userId) return undefined

      const membersQueries = queryClient.getQueriesData<RoomMemberWithStatus[]>({
        queryKey: ['rooms'],
      })

      for (const [queryKey, data] of membersQueries) {
        if (queryKey[2] !== 'members' || !data) continue
        const member = data.find((m) => m.userId === userId)
        if (member) {
          const { isOnline: _, ...user } = member
          return user
        }
      }

      return undefined
    },
  })
}
