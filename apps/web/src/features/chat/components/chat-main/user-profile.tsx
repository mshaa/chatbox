'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserById } from '@/features/chat/api/use-user-by-id'
import { useUserProfile } from '@/features/chat/api/use-user-profile'
import { useOpenDm } from '@/features/chat/hooks/use-open-dm'
import { useViewStore } from '@/features/chat/stores/view.store'
import { ArrowLeft, MessageSquare, Upload } from 'lucide-react'

export function UserProfile({ userId }: { userId: string | null }) {
  const { setView } = useViewStore()
  const { data: currentUser } = useUserProfile()
  const { data: profileUser, isLoading } = useUserById(userId)
  const { openDm, isPending } = useOpenDm()

  const isCurrentUser = currentUser.userId === userId

  const handleMessage = () => {
    if (profileUser) {
      openDm(profileUser)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (!profileUser) {
    return <div className="flex items-center justify-center h-full">User not found</div>
  }

  return (
    <div className="flex flex-col h-full chat-bg">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
        <Button variant="ghost" size="icon" onClick={() => setView('chat')} className='cursor-pointer'>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-lg">Profile</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-md mx-auto flex flex-col items-center space-y-6">
          <div className="relative group">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profileUser.avatar || undefined} alt={profileUser.username} />
              <AvatarFallback className="text-4xl">
                {profileUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{profileUser.username}</h1>
            <p className="text-muted-foreground">{profileUser.userId}</p>
          </div>

          {!isCurrentUser && (
            <div className="w-full pt-4">
              <Button className="w-full gap-2 cursor-pointer" onClick={handleMessage} disabled={isPending}>
                <MessageSquare className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
