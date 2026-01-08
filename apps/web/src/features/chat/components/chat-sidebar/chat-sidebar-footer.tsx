'use client'

import { ChevronsUpDown, LogOut, User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { useViewStore } from '@/features/chat/stores/view.store'
import { useSignOut } from '@/hooks/use-auth'
import { useUserProfile } from '../../api/use-user-profile'
import { useSocketStore } from '../../stores/socket.store'

export function ChatSidebarFooter() {
  const { isMobile } = useSidebar()
  const { data: user } = useUserProfile()
  const { signOut } = useSignOut()
  const setView = useViewStore( s => s.setView)
  const isConnected = useSocketStore((s) => s.isConnected)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar!} alt={user.username} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{user.username}</span>
                  <div
                    className={`size-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                    title={isConnected ? 'Online' : 'Offline'}
                  />
                </div>
                {/*<span className="truncate text-xs">{user.username}@email.com</span>*/}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar!} alt={user.username} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{user.username}</span>
                    <div
                      className={`size-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                      title={isConnected ? 'Online' : 'Offline'}
                    />
                  </div>
                  {/*<span className="truncate text-xs">{user.username}@email.com</span>*/}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setView('profile', user.userId)} className='cursor-pointer'>
                <User />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className='cursor-pointer'>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
