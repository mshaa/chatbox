import { chatQueries } from '@/lib/queries/factory'
import { UserChats } from '@chatbox/contracts'
import { useSuspenseQuery } from '@tanstack/react-query'

export type ChatTransformer<T> = (data: UserChats) => T

export const useUserChats = <T = UserChats>(select?: ChatTransformer<T>) => {
  return useSuspenseQuery({
    ...chatQueries['chats.me'],
    select,
  })
}
