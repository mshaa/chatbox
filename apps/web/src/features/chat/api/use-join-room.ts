import { chatMutations } from '@/lib/queries/factory'
import { useMutation } from '@tanstack/react-query'

export const useJoinRoom = () => {
  return useMutation({
    ...chatMutations['rooms.join'],
  })
}
