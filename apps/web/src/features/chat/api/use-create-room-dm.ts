import { chatMutations } from '@/lib/queries/factory'
import { useMutation } from '@tanstack/react-query'

export const useCreateRoomDm = () => {
  return useMutation({
    ...chatMutations['rooms.createDm'],
  })
}
