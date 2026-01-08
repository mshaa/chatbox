'use client'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ChatDetails } from '@/features/chat/components/chat-main/chat-details'
import { ChatMainLoading } from '@/features/chat/components/chat-main/chat-main-loading'
import { ChatPlaceholder } from '@/features/chat/components/chat-main/chat-placeholder'
import { MessageInput } from '@/features/chat/components/chat-main/message-input/message-input'
import { MessageList } from '@/features/chat/components/chat-main/message-list'
import { useRoomName } from '@/features/chat/hooks/use-room-name'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { chatQueries } from '@/lib/queries/factory'
import { useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect } from 'react'

export function ChatMain() {
  const activeRoom = useRoomStore((s) => s.activeRoom)

  const roomName = useRoomName(activeRoom)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (activeRoom) {
      queryClient.invalidateQueries(chatQueries['rooms.members'](activeRoom.roomId))
    }
  }, [activeRoom])

  if (!activeRoom) return <ChatPlaceholder />

  return (
    <Suspense key={activeRoom.roomId} fallback={<ChatMainLoading roomType={activeRoom?.type} />}>
      <div className="flex h-dvh min-h-0 overflow-hidden">
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <span className="font-semibold truncate">{roomName}</span>
            </div>
          </header>
          <MessageList chatId={activeRoom.roomId} />
          <MessageInput room={activeRoom} />
        </div>
        {activeRoom.type === 'group' && <ChatDetails chatId={activeRoom.roomId} />}
      </div>
    </Suspense>
  )
}
