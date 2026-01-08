'use client'

import { MessageSquarePlus } from 'lucide-react'

export function ChatPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="flex justify-center">
          <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">No active chat</h2>
        <p className="text-muted-foreground">
          Select a chat from the sidebar or discover new groups to start messaging.
        </p>
      </div>
    </div>
  )
}
