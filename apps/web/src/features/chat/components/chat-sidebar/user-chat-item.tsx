'use client'

import { Badge } from '@/components/ui/badge'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useRoomName } from '@/features/chat/hooks/use-room-name'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { useViewStore } from '@/features/chat/stores/view.store'
import { UserChat } from '@chatbox/contracts'
import { User, Users } from 'lucide-react'
import { memo, useDeferredValue } from 'react'

export const UnreadBadge = memo(function UnreadBadge({ chatId }: {chatId: string}) {
  const unreadCount = useRoomStore((s) => s.unreadCounts[chatId]);
  const showUnreadCount = useViewStore((s) => s.showUnreadCount[chatId] ?? true);
  if (!unreadCount || !showUnreadCount) return null;
  return (
    <Badge
      variant="secondary"
      className="ml-auto h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]"
    >
      {unreadCount > 999 ? '999+' : unreadCount}
    </Badge>
  );
});

export const UserChatItem = memo(function UserChatItem({ chat, isActive }: { chat: UserChat; isActive: boolean }) {
  const setActiveRoom = useRoomStore( s => s.setActiveRoom)
  const setView = useViewStore(s => s.setView)
  const roomName = useRoomName(chat)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => {
          setActiveRoom(chat)
          setView('chat')
        }}
        data-testid={`room-item-${chat.name}`}
        className="group-data-[collapsible=icon]:!p-2 cursor-pointer"
      >
        {chat.type === 'dm' ? (
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate">{roomName}</span>
        <UnreadBadge chatId={chat.roomId} />
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}, (prev, next) => {
  return prev.chat.roomId === next.chat.roomId && prev.isActive === next.isActive
})
