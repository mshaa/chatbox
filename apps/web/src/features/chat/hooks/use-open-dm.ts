import { useUserChats } from '@/features/chat/api/use-user-chats'
import { useUserProfile } from '@/features/chat/api/use-user-profile'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { useViewStore } from '@/features/chat/stores/view.store'
import { BaseUser } from '@chatbox/contracts'
import { generateDmSlug } from '@chatbox/persistence/tools'
import { useQueryClient } from '@tanstack/react-query'
import { NIL } from 'uuid'
import { useCreateRoomDm } from '../api/use-create-room-dm'

export const useOpenDm = () => {
  const { data: userChats } = useUserChats()
  const { data: currentUser } = useUserProfile()
  const { setActiveRoom } = useRoomStore()
  const { setView } = useViewStore()
  const { mutate: createDm, isPending } = useCreateRoomDm()
  const queryClient = useQueryClient()

  const openDm = (user: BaseUser) => {
    if (!currentUser) return

    const expectedSlug = generateDmSlug(currentUser.userId, user.userId)
    const existingRoom = userChats?.find((chat) => chat.slug === expectedSlug)

    if (existingRoom) {
      setActiveRoom(existingRoom)
    } else {
      setActiveRoom({ name: user.username, roomId: NIL, slug: user.userId, type: "dm", unreadCount: 0 })
    }
    setView('chat')
  }

  return { openDm, isPending }
}
