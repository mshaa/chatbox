'use client'

import Image from 'next/image'
import * as React from 'react'

import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function ChatSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center px-2 ">
          <Image
            src="/chatbox.svg"
            alt="Chatbox"
            width={200}
            height={60}
            priority
            className="[&_path]:fill-foreground [&_rect]:fill-foreground [&_circle]:fill-foreground"
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
