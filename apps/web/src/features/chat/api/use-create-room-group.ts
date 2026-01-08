import { chatMutations } from '@/lib/queries/factory'
import { useMutation } from '@tanstack/react-query'

export const useCreateRoomGroup = () => {
  return useMutation({
    ...chatMutations['rooms.createGroup'],
  })
}
