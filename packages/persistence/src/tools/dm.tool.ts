export const generateDmSlug = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort()
  return `dm-${sortedIds.join('-')}`
}

export const generateDmName = (username1: string, username2: string): string => {
  return `${username1} & ${username2}`
}
