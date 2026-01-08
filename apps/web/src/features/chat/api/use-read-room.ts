import { chatMutations } from '@/lib/queries/factory'
import { useMutation } from '@tanstack/react-query'

export const useReadRoom = (roomId: string) => {
  return useMutation({
    ...chatMutations['rooms.read'](roomId),
  })
}
