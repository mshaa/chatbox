import { useUserChats } from '@/features/chat/api/use-user-chats'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { useMemo } from 'react'

export function useOrderedChats() {
  const { data: chatItems } = useUserChats()
  const lastActivity = useRoomStore((s) => s.lastActivity)

  return useMemo(() => {
    if (!chatItems || !lastActivity.size) return []

    const map = new Map<string, (typeof chatItems)[number]>()
    for (const item of chatItems) {
      map.set(item.roomId, item)
    }

    return Array.from(lastActivity).reduce<(typeof chatItems)>((acc, id) => {
      const item = map.get(id)
      if (item) acc.push(item)
      return acc
    }, [])
  }, [chatItems, lastActivity])
}
