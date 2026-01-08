'use client'

import { Button } from '@/components/ui/button'
import { useJoinRoom } from '@/features/chat/api/use-join-room'
import { useUserChats } from '@/features/chat/api/use-user-chats'
import { useMessageSubmit } from '@/features/chat/hooks/use-message-submit'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { chatQueries } from '@/lib/queries/factory'
import { UserChat } from '@chatbox/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { memo, useCallback, useMemo } from 'react'
import { MessageForm } from './message-form'

export const MessageInput = memo(function MessageInput({ room }: { room: UserChat | Partial<UserChat> }) {
  const queryClient = useQueryClient()
  const updateLastActivity = useRoomStore((s) => s.updateLastActivity)
  const { data: userChats } = useUserChats()
  const { mutate: joinRoom, isPending: isJoining } = useJoinRoom()

  const { handleSubmit, isPending } = useMessageSubmit(room)

  const isMember = useMemo(
    () => userChats?.some((uc) => uc.roomId === room.roomId),
    [userChats, room.roomId],
  )

  const handleJoin = useCallback(() => {
    if (!room.roomId) return
    joinRoom(room.roomId, {
      onSuccess: async () => {
        await queryClient.refetchQueries(chatQueries['chats.me'])
        updateLastActivity(room.roomId!)
      },
    })
  }, [joinRoom, room.roomId, queryClient, updateLastActivity])

  const showJoinButton = room.type === 'group' && !isMember

  return (
    <div className="p-4 border-t bg-background">
      {showJoinButton ? (
        <div className="flex items-center justify-center">
          <Button onClick={handleJoin} disabled={isJoining} className='cursor-pointer'>Join Room</Button>
        </div>
      ) : (
        <MessageForm onSubmit={handleSubmit} />
      )}
    </div>
  )
})
