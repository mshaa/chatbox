'use client'

import { useCreateRoomDm } from '@/features/chat/api/use-create-room-dm'
import { usePostMessage } from '@/features/chat/api/use-post-message'
import { useUserProfile } from '@/features/chat/api/use-user-profile'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { chatQueries } from '@/lib/queries/factory'
import { UserChat } from '@chatbox/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { startTransition } from 'react'
import { NIL, v7 } from 'uuid'

const isDmDraft = (room: Partial<UserChat>) => {
  return room.type === 'dm' && room.roomId === NIL && room.slug
}

export function useMessageSubmit(room: UserChat | Partial<UserChat>) {
  const queryClient = useQueryClient()
  const { data: user } = useUserProfile()
  const { setActiveRoom, updateLastActivity, addPendingMessage } = useRoomStore()

  const isDraft = isDmDraft(room)

  const { mutate: createDm, isPending: isCreatingDm } = useCreateRoomDm()

  const { mutate: postMessage, isPending: isPosting } = usePostMessage(room.roomId ?? NIL)

  const handleSubmit = useCallback(
    (content: string) => {
      const clientMsgId = v7()

      if (isDraft) {
        createDm(
          { clientMsgId, content, targetUserId: room.slug! },
          {
            onSuccess: async (createdRoom) => {
              queryClient.setQueryData(
                chatQueries['rooms.history'](createdRoom.roomId).queryKey,
                { pages: [{ items: [], nextCursor: null, prevCursor: null }], pageParams: [null] }
              )
              queryClient.setQueryData(
                chatQueries['rooms.members'](createdRoom.roomId).queryKey,
                []
              )

              addPendingMessage({
                messageId: '',
                clientMsgId,
                roomId: createdRoom.roomId,
                userId: user.userId,
                content,
                createdAt: new Date(),
                status: 'pending',
              })

              await queryClient.refetchQueries(chatQueries['chats.me'])

              updateLastActivity(createdRoom.roomId)

              // @issue this suppose to prevent flickering, but is it?
              startTransition(() => {
                setActiveRoom({ ...createdRoom, unreadCount: 0 })
              })

              queryClient.invalidateQueries({
                queryKey: chatQueries['rooms.members'](createdRoom.roomId).queryKey,
              })
              queryClient.invalidateQueries({
                queryKey: chatQueries['rooms.history'](createdRoom.roomId).queryKey,
              })
            },
          },
        )
      } else {
        postMessage({ content, clientMsgId })
      }
    },
    [isDraft, room.slug, room.roomId, createDm, postMessage, queryClient, user.userId, addPendingMessage, updateLastActivity, setActiveRoom],
  )

  return {
    handleSubmit,
    isPending: isDraft ? isCreatingDm : isPosting,
  }
}
