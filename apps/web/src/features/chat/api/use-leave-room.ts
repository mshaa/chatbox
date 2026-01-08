import { chatMutations } from '@/lib/queries/factory'
import { useMutation } from '@tanstack/react-query'

export const useLeaveRoom = (roomId: string) => {
  return useMutation({
    ...chatMutations['rooms.leave'](roomId),
  })
}
