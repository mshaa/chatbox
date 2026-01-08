'use client'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'

export function ChatLoading() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex flex-col gap-1 overflow-hidden">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2 space-y-2 overflow-hidden">
            <Skeleton className="h-4 w-16 mx-2 my-2" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
          <div className="p-2 space-y-2 mt-4 overflow-hidden">
            <Skeleton className="h-4 w-20 mx-2 my-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex flex-col gap-1 overflow-hidden">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className='overflow-hidden'>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </header>
        <div className="flex-1 p-4 space-y-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex gap-4 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div
                className={`space-y-2 flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'}`}
              >
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton
                  className={`h-12 w-[60%] rounded-2xl ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-background">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
