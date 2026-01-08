export const CACHE_KEY_ROOMS_DISCOVER = 'rooms:discover'
export const CACHE_KEY_LAST_READ_DIRTY = 'lastread:dirty'

export const cacheKeyLastRead = (roomId: string, userId: string) =>
  `lastread:${roomId}:${userId}`

export const cacheKeyUserProfile = (userId: string) =>
  `user:${userId}`

export const cacheKeyRoomMembers = (roomId: string) =>
  `room:${roomId}:members`

export const cacheKeyRoomOnline = (roomId: string) =>
  `room:${roomId}:online`

export const cacheKeyRefreshToken = (tokenId: string) =>
  `refresh_token:${tokenId}`

export const cacheKeyUserTokens = (userId: string) =>
  `user_tokens:${userId}`

export const parseLastReadDirtyEntry = (entry: string) => {
  const [roomId, userId] = entry.split(':')
  return { roomId, userId }
}
