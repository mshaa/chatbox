'use client'

import { useAuthStore } from '@/stores/auth.store'
import { ChatContent } from './chat-content'

export function ChatContentShell() {
  const { sessionId } = useAuthStore()
  return <ChatContent key={sessionId} />
}
