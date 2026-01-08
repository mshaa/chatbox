'use client'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

type ChatMainLoadingProps = {
  roomType?: 'dm' | 'group'
}

export function ChatMainLoading({ roomType = 'dm' }: ChatMainLoadingProps) {
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden">
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header Skeleton */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </header>

        {/* Empty Message Area - matches MessageList container */}
        <div className="relative min-h-0 flex-1 w-full chat-bg" />

        {/* Message Input Skeleton */}
        <div className="p-4 border-t h-10 bg-background">
          {/*<Skeleton className="h-10 w-full rounded-full" />*/}
        </div>
      </div>

      {/* Group Details Sidebar - matches ChatDetails layout */}
      {roomType === 'group' && (
        <aside className="w-80 border-l flex flex-col bg-background hidden lg:flex h-full overflow-hidden">
          <div className="p-4 border-b shrink-0">
            <h3 className="font-semibold text-lg">Members</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 hover-scroll" />

          <div className="p-4 border-t mt-auto shrink-0 space-y-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
      )}
    </div>
  )
}
