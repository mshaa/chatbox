'use client'

import * as React from 'react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar'
import { useOrderedChats } from '@/features/chat/hooks/use-ordered-chats'
import { useDiscoverRooms } from '../../api/use-discover-rooms'
import { useResizableSidebar } from '../../hooks/use-resizable-sidebar'
import { ChatSidebarFooter } from './chat-sidebar-footer'
import { ChatSidebarHeader } from './chat-sidebar-header'
import { DiscoverableRoomList } from './discoverable-room-list'
import { UserChatList } from './user-chat-list'
import { ComponentProps } from 'react'

export function ChatSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { topSectionHeight, isDragging, containerRef, handleMouseDown } = useResizableSidebar()


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ChatSidebarHeader />
      </SidebarHeader>
      <div ref={containerRef} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <SidebarContent
          className="hover-scroll overflow-y-auto flex-none"
          style={{ height: `${topSectionHeight}%` }}
        >
        <UserChatList />
        </SidebarContent>
        <div
          className="h-1 bg-border hover:bg-accent cursor-row-resize flex-shrink-0 transition-colors"
          onMouseDown={handleMouseDown}
          style={{ backgroundColor: isDragging ? 'hsl(var(--accent))' : undefined }}
        />
        <SidebarContent
          className="hover-scroll overflow-y-auto"
          style={{ height: `${100 - topSectionHeight}%` }}
        >
          <DiscoverableRoomList  />
        </SidebarContent>
      </div>
      <SidebarFooter>
        <ChatSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
