import { chatMutations } from '@/lib/queries/factory'
import { useMutation } from '@tanstack/react-query'
import { useRoomStore } from '../stores/room.store'
import { useUserProfile } from './use-user-profile'

export const usePostMessage = (roomId: string) => {
  const { data: user } = useUserProfile()
  const { addPendingMessage, updateMessageStatus } = useRoomStore()

  return useMutation({
    ...chatMutations['rooms.postMessage'](roomId),
    onMutate: async (newMessage) => {
      if (!user) return

      addPendingMessage({
        messageId: "",
        clientMsgId: newMessage.clientMsgId,
        roomId: roomId,
        userId: user.userId,
        content: newMessage.content,
        createdAt: new Date(),
        status: 'pending',
      })
    },
    onError: (err, newMessage) => {
      updateMessageStatus(roomId, newMessage.clientMsgId, 'failed')
    },
  })
}
