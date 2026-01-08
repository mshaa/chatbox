'use client'

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar'
import { UserChat } from '@chatbox/contracts'
import { memo, useCallback } from 'react'
import { useRoomStore } from '../../stores/room.store'
import { UserChatItem } from './user-chat-item'
import { useOrderedChats } from '@/features/chat/hooks/use-ordered-chats'

export const UserChatList = memo(function UserChatList() {
  const sortedChats = useOrderedChats()

  const activeRoom = useRoomStore(s => s.activeRoom)

  const isActiveChat = useCallback(
    (chat: UserChat) => {
      return activeRoom?.roomId === chat?.roomId
    },
    [activeRoom],
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarMenu>
        {sortedChats.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">
            No chats yet
          </div>
        ) : (
          sortedChats.map((chat) => (
            <UserChatItem key={chat.roomId} chat={chat} isActive={isActiveChat(chat)} />
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
})
