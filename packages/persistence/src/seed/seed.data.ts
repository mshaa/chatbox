/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as argon2 from 'argon2'
import { getServerConfig } from '@chatbox/config/server'
import { v7 } from 'uuid'
import { generateDmName, generateDmSlug } from '../tools'

const createId = () => v7()

const rawUsers = [
  { username: 'user_main', avatar: 'https://i.pravatar.cc/150?img=1' },
  { username: 'user_observer', avatar: 'https://i.pravatar.cc/150?img=2' },
  { username: 'user_member', avatar: 'https://i.pravatar.cc/150?img=2' },
  { username: 'user_joiner', avatar: 'https://i.pravatar.cc/150?img=3' },
  { username: 'user_leaver', avatar: 'https://i.pravatar.cc/150?img=4' },
  { username: 'user_no_rooms', avatar: 'https://i.pravatar.cc/150?img=5' },
]

const getSeedUsers = async () => {
  const config = getServerConfig()
  const argon2Options = {
    memoryCost: config.AUTH_ARGON2_MEMORY_COST,
    timeCost: config.AUTH_ARGON2_TIME_COST,
    parallelism: config.AUTH_ARGON2_PARALLELISM,
  }
  const commonPassword = 'password'
  return Promise.all(
    rawUsers.map(async (user) => ({
      ...user,
      userId: createId(),
      passwordHash: await argon2.hash(commonPassword, argon2Options),
    })),
  )
}

export const getSeedData = async () => {
  const seedUsers = await getSeedUsers()

  const seedGroupRooms = [
    {
      roomId: createId(),
      name: 'General',
      slug: 'general',
      type: 'group' as const,
    },
    {
      roomId: createId(),
      name: 'Join Target',
      slug: 'join-target',
      type: 'group' as const,
    },
    {
      roomId: createId(),
      name: 'Restricted Room',
      slug: 'restricted-room',
      type: 'group' as const,
    },
  ]

  const privateRooms: { roomId: string; name: string; slug: string; type: 'dm' }[] = []
  const privateRoomUsers: { userId: string; roomId: string }[] = []
  const privateRoomMessages: {
    messageId: string
    clientMsgId: string
    roomId: string
    userId: string
    content: string
  }[] = []

  const usersForDms = seedUsers.filter((u) => u.username !== 'user_no_rooms')
  for (let i = 0; i < usersForDms.length; i++) {
    for (let j = i + 1; j < usersForDms.length; j++) {
      const user1 = usersForDms[i]
      const user2 = usersForDms[j]
      const slug = generateDmSlug(user1.userId, user2.userId)
      const name = generateDmName(user1.username, user2.username)

      const dmRoom = {
        roomId: createId(),
        name,
        slug,
        type: 'dm' as const,
      }
      privateRooms.push(dmRoom)

      privateRoomUsers.push({ userId: user1.userId, roomId: dmRoom.roomId })
      privateRoomUsers.push({ userId: user2.userId, roomId: dmRoom.roomId })

      privateRoomMessages.push({
        messageId: createId(),
        clientMsgId: createId(),
        roomId: dmRoom.roomId,
        userId: user1.userId,
        content: `Hey ${user2.username}, sending you a direct message.`,
      })
      privateRoomMessages.push({
        messageId: createId(),
        clientMsgId: createId(),
        roomId: dmRoom.roomId,
        userId: user2.userId,
        content: `Got it ${user1.username}, DM received.`,
      })
    }
  }

  const allRooms = [...seedGroupRooms, ...privateRooms]

  const groupMessages = [
    // Room 1: General
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[0].roomId,
      userId: seedUsers[0].userId,
      content: 'Welcome everyone, this is the main chat room.',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[0].roomId,
      userId: seedUsers[1].userId,
      content: 'Testing message delivery in General.',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[0].roomId,
      userId: seedUsers[2].userId,
      content: 'Can everyone see this message?',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[0].roomId,
      userId: seedUsers[3].userId,
      content: 'All good here, messages are coming through.',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[0].roomId,
      userId: seedUsers[4].userId,
      content: 'What topics are we covering today?',
    },

    // Room 2: Join Target
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[1].roomId,
      userId: seedUsers[0].userId,
      content: 'This room is used to test join functionality.',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[1].roomId,
      userId: seedUsers[1].userId,
      content: 'Welcome to anyone who joins!',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[1].roomId,
      userId: seedUsers[2].userId,
      content: 'New members can join anytime.',
    },

    // Room 3: Restricted Room
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[2].roomId,
      userId: seedUsers[3].userId,
      content: 'Only authorized members can post here.',
    },
    {
      messageId: createId(),
      clientMsgId: createId(),
      roomId: seedGroupRooms[2].roomId,
      userId: seedUsers[4].userId,
      content: 'This room has limited membership.',
    },
  ]

  const allMessages = [...groupMessages, ...privateRoomMessages]

  const seedGroupRoomUsers = [
    // All users in General
    { userId: seedUsers[0].userId, roomId: seedGroupRooms[0].roomId },
    { userId: seedUsers[1].userId, roomId: seedGroupRooms[0].roomId },
    { userId: seedUsers[2].userId, roomId: seedGroupRooms[0].roomId },
    { userId: seedUsers[3].userId, roomId: seedGroupRooms[0].roomId },
    { userId: seedUsers[4].userId, roomId: seedGroupRooms[0].roomId },
    // user_main, user_observer, user_member in Join Target
    { userId: seedUsers[0].userId, roomId: seedGroupRooms[1].roomId },
    { userId: seedUsers[1].userId, roomId: seedGroupRooms[1].roomId },
    { userId: seedUsers[2].userId, roomId: seedGroupRooms[1].roomId },
    // user_joiner and user_leaver in Restricted Room
    { userId: seedUsers[3].userId, roomId: seedGroupRooms[2].roomId },
    { userId: seedUsers[4].userId, roomId: seedGroupRooms[2].roomId },
  ]

  const allRoomUsers = [...seedGroupRoomUsers, ...privateRoomUsers]

  return {
    users: seedUsers,
    rooms: allRooms,
    messages: allMessages,
    roomUsers: allRoomUsers,
  }
}
