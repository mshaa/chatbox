'use client'

import { PlusCircle, Users } from 'lucide-react'
import React, { memo } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { chatQueries } from '@/lib/queries/factory'
import { DiscoverRoom } from '@chatbox/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateRoomGroup } from '../../api/use-create-room-group'
import { useRoomStore } from '../../stores/room.store'
import { useViewStore } from '../../stores/view.store'
import { useDiscoverRooms } from '@/features/chat/api/use-discover-rooms'

export const DiscoverableRoomList = memo(function DiscoverableRoomList() {
  const { data: discoverItems } = useDiscoverRooms()

  const [groupName, setGroupName] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const { mutate: createRoom, isPending } = useCreateRoomGroup()
  const setActiveRoom = useRoomStore(s => s.setActiveRoom)
  const updateLastActivity = useRoomStore(s => s.updateLastActivity)
  const setView = useViewStore(s => s.setView)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName.trim()) {
      createRoom(
        {
          name: groupName.trim(),
        },
        {
          onSuccess: async (newRoom) => {
            setGroupName('')
            setOpen(false)
            await queryClient.refetchQueries(chatQueries['chats.me'])
            queryClient.invalidateQueries(chatQueries['rooms.discover'])
            updateLastActivity(newRoom.roomId)
            setActiveRoom({ ...newRoom, unreadCount: 0 })
            setView('chat')
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <SidebarGroupLabel>Discover</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <DialogTrigger asChild>
              <SidebarMenuButton className='cursor-pointer'>
                <PlusCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">Create Group</span>
              </SidebarMenuButton>
            </DialogTrigger>
          </SidebarMenuItem>

          {discoverItems.map((item) => (
            <SidebarMenuItem key={item.roomId}>
              <SidebarMenuButton
                tooltip={item.name}
                onClick={() => {
                  setActiveRoom({ ...item, unreadCount: 0 })
                  setView('chat')
                }}
                onMouseEnter={() => {
                  const staleTime = 10 * 60 * 1000 // 10 minutes
                  queryClient.prefetchInfiniteQuery({
                    ...chatQueries['rooms.history'](item.roomId),
                    staleTime,
                  })
                  queryClient.prefetchQuery({
                    ...chatQueries['rooms.members'](item.roomId),
                    staleTime,
                  })
                }}
                className="justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Give your group a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !groupName.trim()} className='cursor-pointer'>
              {isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
