import { UserChat } from '@chatbox/contracts'
import { useUserProfile } from '../api/use-user-profile'

export function useRoomName(room: UserChat | undefined) {
  const { data: user } = useUserProfile()

  if (!room) return ""

  if (room.type === 'group') return room.name

  if (user && room.type === 'dm') {
    const parts = room.name.split(' & ')
    if (parts.length === 2) {
      if (parts[0] === user.username) return parts[1]
      if (parts[1] === user.username) return parts[0]
    }
  }

  return room.name
}
