import { chatQueries } from '@/lib/queries/factory'
import { useSuspenseQuery } from '@tanstack/react-query'

export const useUserProfile = () => {
  return useSuspenseQuery({
    ...chatQueries['users.me'],
  })
}
