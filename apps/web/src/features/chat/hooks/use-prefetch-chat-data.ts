import { chatQueries } from '@/lib/queries/factory'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUserChats } from '../api/use-user-chats'

export function usePrefetchChatData() {
  const queryClient = useQueryClient()
  const { data: userChats } = useUserChats()

  useEffect(() => {
    userChats?.forEach((chat) => {

      const historyOptions = chatQueries['rooms.history'](chat.roomId, chat.lastReadMessageId)
      if (!queryClient.getQueryData(historyOptions.queryKey)) {
        queryClient.prefetchInfiniteQuery(historyOptions)
      }

      const membersOptions = chatQueries['rooms.members'](chat.roomId)
      if (!queryClient.getQueryData(membersOptions.queryKey)) {
        queryClient.prefetchQuery(membersOptions)
      }
    })
  }, [])
}
