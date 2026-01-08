'use client'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useUserChats } from '@/features/chat/api/use-user-chats'
import { ChatMain } from '@/features/chat/components/chat-main/chat-main'
import { ChatMainLoading } from '@/features/chat/components/chat-main/chat-main-loading'
import { ChatPlaceholder } from '@/features/chat/components/chat-main/chat-placeholder'
import { UserProfile } from '@/features/chat/components/chat-main/user-profile'
import { ChatSidebar } from '@/features/chat/components/chat-sidebar/chat-sidebar'
import { ChatToaster } from '@/features/chat/components/chat-toaster'
import { usePrefetchChatData } from '@/features/chat/hooks/use-prefetch-chat-data'
import { useSocketInit } from '@/features/chat/hooks/use-socket-init'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { useViewStore } from '@/features/chat/stores/view.store'
import { useEffect } from 'react'

export function ChatContent() {
  const { data: userChats } = useUserChats()

  const currentView = useViewStore((s) => s.currentView);
  const profileUserId = useViewStore((s) => s.profileUserId);

  const initRooms = useRoomStore((s) => s.initRooms);
  const setActiveRoom = useRoomStore((s) => s.setActiveRoom);

  useSocketInit()
  usePrefetchChatData()

  useEffect(() => {
    if (userChats) initRooms(userChats)
  }, [])

  useEffect(() => {
    const general = userChats.find((r) => r.name === 'General')
    if (general) {
      setActiveRoom(general)
    }
  }, [])

  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset className="overflow-hidden">
        {currentView === 'profile' ?
          <UserProfile userId={profileUserId} />
          : <ChatMain />}
        <ChatToaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
