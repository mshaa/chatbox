'use client'

import { Toaster } from '@/components/ui/sonner'
import { useUserById } from '@/features/chat/api/use-user-by-id'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useUserChats } from '../api/use-user-chats'
import { useRoomStore } from '../stores/room.store'

function usePreviewToasts() {
  const queryClient = useQueryClient()
  const { data: rooms } = useUserChats()
  const previewMessage = useRoomStore((s) => s.previewMessage)
  const { data: user } = useUserById(previewMessage?.userId!)

  useEffect(() => {
    if (!previewMessage) return

    const room = rooms?.find((r) => r.roomId === previewMessage.roomId)
    const roomName = room?.name ?? 'Unknown'

    const username = user?.username ?? 'Someone'

    const content =
      previewMessage.content.length > 80
        ? previewMessage.content.slice(0, 80) + '...'
        : previewMessage.content

    toast(
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold">{roomName}</span>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{username}: </span>
          {content}
        </span>
      </div>,
    )
  }, [previewMessage, queryClient])
}

export function ChatToaster() {
  usePreviewToasts()
  return <Toaster position='top-right' />
}
