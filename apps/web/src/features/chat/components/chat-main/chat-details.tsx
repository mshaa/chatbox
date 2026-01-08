'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUserChats } from '@/features/chat/api/use-user-chats'
import { chatQueries } from '@/lib/queries/factory'
import { RoomMemberWithStatus } from '@chatbox/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useLeaveRoom } from '../../api/use-leave-room'
import { useRoomMembers, useSuspenseRoomMembers } from '../../api/use-room-members'
import { useUserProfile } from '../../api/use-user-profile'
import { useSocketStore } from '../../stores/socket.store'
import { useViewStore } from '../../stores/view.store'

const selectWithStatus = (members: RoomMemberWithStatus[]) =>
  members.map((m) => ({
    id: m.userId,
    name: m.username,
    status: m.isOnline ? 'online' : 'offline',
    avatar: m.avatar as string,
  }))

const MemberItem = memo(function MemberItem({
  member,
}: {
  member: ReturnType<typeof selectWithStatus>[number];
}) {
  const setView = useViewStore(s => s.setView)

  return (
    <div
      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
      onClick={() => setView('profile', member.id)}
    >
      <img
        src={member.avatar}
        alt={member.name}
        className="size-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover shrink-0 select-none"
        onClick={() => setView('profile', member.id)}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.name}</p>
      </div>
      <Badge
        variant={member.status === 'online' ? 'default' : 'outline'}
        className={member.status === 'online' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
      >
        {member.status}
      </Badge>
    </div>
  );
});

export const ChatDetails = memo(function ChatDetails({ chatId }: { chatId: string }) {
  const { mutate: leaveRoom } = useLeaveRoom(chatId)
  const queryClient = useQueryClient()
  const { data: userChats } = useUserChats()
  const { data: currentUser } = useUserProfile()
  const isConnected = useSocketStore((s) => s.isConnected)

  const { data: membersRaw } = useSuspenseRoomMembers(chatId, selectWithStatus)

  const members = useMemo(
    () =>
      membersRaw?.map((m) =>
        m.id === currentUser.userId
          ? { ...m, status: isConnected ? 'online' : 'offline' }
          : m
      ),
    [membersRaw, currentUser.userId, isConnected]
  )

  const isMember = useMemo(() => userChats?.some((r) => r.roomId === chatId), [userChats, chatId])

  return (
    <aside className="w-80 border-l flex flex-col bg-background hidden lg:flex h-full overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <h3 className="font-semibold text-lg">Members</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 hover-scroll">
        {members?.map((member) => (
          <MemberItem
            key={member.id}
            member={member}
          />
        ))}
      </div>

      {isMember && (
        <div className="p-4 border-t mt-auto shrink-0 space-y-4">
          {/*<h3 className="font-semibold text-lg">Actions</h3>*/}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={() =>
              leaveRoom(undefined, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: chatQueries['chats.me'].queryKey })
                },
              })
            }
          >
            <LogOut className="h-4 w-4" />
            Leave Group
          </Button>
        </div>
      )}
    </aside>
  )
})
