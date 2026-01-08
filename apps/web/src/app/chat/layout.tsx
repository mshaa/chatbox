import { AuthGuard } from '@/components/auth-guard'
import { ChatLoading } from '@/features/chat/components/chat-loading'
import { ReactNode } from 'react'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth={true} loading={<ChatLoading />}>
      {children}
    </AuthGuard>
  )
}
