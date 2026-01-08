/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as argon2 from 'argon2'
import { getServerConfig } from '@chatbox/config/server'
import { v7 } from 'uuid'
import { generateDmName, generateDmSlug } from '../tools'

const createId = () => v7()

const rawUsers = [
  { username: 'blazing_phoenix_42', avatar: 'https://i.pravatar.cc/150?img=1' },
  { username: 'coffee_coder_99', avatar: 'https://i.pravatar.cc/150?img=2' },
  { username: 'midnight_owl_23', avatar: 'https://i.pravatar.cc/150?img=3' },
  { username: 'pixel_surfer_88', avatar: 'https://i.pravatar.cc/150?img=4' },
  { username: 'quantum_fox_17', avatar: 'https://i.pravatar.cc/150?img=5' },
  { username: 'neon_drifter_55', avatar: 'https://i.pravatar.cc/150?img=6' },
  { username: 'echo_wanderer_31', avatar: 'https://i.pravatar.cc/150?img=7' },
  { username: 'storm_chaser_76', avatar: 'https://i.pravatar.cc/150?img=8' },
  { username: 'velvet_tiger_44', avatar: 'https://i.pravatar.cc/150?img=9' },
  { username: 'cosmic_pirate_62', avatar: 'https://i.pravatar.cc/150?img=10' },
  { username: 'amber_knight_19', avatar: 'https://i.pravatar.cc/150?img=11' },
  { username: 'shadow_rider_08', avatar: 'https://i.pravatar.cc/150?img=12' },
  { username: 'turbo_penguin_33', avatar: 'https://i.pravatar.cc/150?img=13' },
  { username: 'frozen_flame_71', avatar: 'https://i.pravatar.cc/150?img=14' },
  { username: 'chrome_wolf_56', avatar: 'https://i.pravatar.cc/150?img=15' },
  { username: 'rusty_anchor_14', avatar: 'https://i.pravatar.cc/150?img=16' },
  { username: 'lunar_spark_90', avatar: 'https://i.pravatar.cc/150?img=17' },
  { username: 'silver_ghost_27', avatar: 'https://i.pravatar.cc/150?img=18' },
  { username: 'atomic_mango_65', avatar: 'https://i.pravatar.cc/150?img=19' },
  { username: 'crimson_haze_48', avatar: 'https://i.pravatar.cc/150?img=20' },
]

const getFullSeedUsers = async () => {
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

// @issue: hack
// Seeded random using simple LCG for reproducible assignments
const seededRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    return state / 0x7fffffff
  }
}

const roomMessages: Record<string, string[]> = {
  'General': [
    'Welcome everyone, glad to have you all here.',
    'Feel free to chat about anything in this room, from your daily routines to deep philosophical questions, as we want everyone to feel included.',
    'This is the main hangout spot, make yourselves at home.',
    'Hey all, how is everyone doing today? I hope your morning has been productive and that you are all looking forward to a relaxing evening.',
    'Anyone have fun plans for the weekend?',
    'Just wanted to say hi to everyone and let you know that I really appreciate the positive energy that this group brings to the table every day.',
    'Good vibes only in here.',
    'What is everyone up to today? I am currently trying to balance a mountain of work with my need to drink an excessive amount of coffee.',
    'Happy to see so many people online.',
    'This chat is always so active, love it. It is truly impressive how there is never a dull moment and someone is always ready to jump in and talk.',
  ],
  'Weather Talk': [
    "It's been raining nonstop here all week.",
    'Sunny and 75 degrees, perfect day to be outside for a long hike, a picnic in the park, or just sitting on the porch with a cold drink.',
    'Anyone else tracking that storm system moving east?',
    'Snow forecast for this weekend, time to stock up on bread, milk, and salt before the grocery store shelves are completely cleared out by the locals.',
    'The humidity is unbearable today.',
    'Finally getting some cooler weather after that heatwave which felt like it was going to last for an eternity and melted everyone’s resolve to stay productive.',
    'Tornado watch issued for the plains states again.',
    'Love the sound of thunderstorms at night because the heavy rain hitting the roof and the distant rumbles of thunder make for the best sleep environment.',
    'Fog was so thick this morning I could barely see.',
    'Wind chill making it feel like -10 out there, so make sure you layer up properly with your heaviest coat and a scarf if you plan on stepping outside.',
  ],
  'Sports Arena': [
    'What a game last night! Did not see that comeback coming.',
    'Draft picks are looking strong this year, and I honestly think this could be the turning point for several franchises that have been struggling for a decade.',
    "My fantasy team is having its worst season ever, can't catch a break.",
    'Overtime finish, absolutely electric atmosphere that had every single fan in the stadium standing on their feet and screaming until their voices were completely gone.',
    'Referee calls have been terrible all season.',
    'Preseason predictions are already falling apart as the underdogs continue to dominate the league and prove that the analysts don’t know as much as they claim.',
    'That rookie is going to be something special.',
    'Playoff race is going to be tight this year, especially with the middle-tier teams suddenly finding their rhythm and challenging the top seeds for a spot.',
    'Best rivalry matchup in years coming up this weekend.',
    'Trade deadline is going to shake things up significantly, as several star players are rumored to be on the move to teams looking for a championship run.',
  ],
  'Music Lounge': [
    'Just discovered this amazing indie band, totally hooked.',
    'Vinyl is making such a huge comeback these days because people are starting to appreciate the tactile experience and the warm, analog sound that streaming just cannot replicate.',
    "Anyone going to any concerts this summer? I'm eyeing a few.",
    'That new album dropped and it is incredible front to back, featuring some of the most innovative production choices and lyricism I have heard in the last five years.',
    'Learning guitar, fingers are killing me but worth it.',
    'Jazz or classical for late night studying? I go back and forth depending on how much focus I need and whether I want a rhythmic pulse or a melodic flow.',
    'Best live performance I have ever seen was last month.',
    'Unpopular opinion: the B-sides are often better than the singles because they allow the artist to experiment more and show a side of their creativity that isn’t radio-friendly.',
    'Music production tools have gotten so accessible now.',
    'What genre do you all listen to while working? I personally find that lo-fi beats or ambient synth tracks help me stay in the zone without being too distracting.',
  ],
  'Movie Night': [
    'Just watched that new thriller, plot twist blew my mind.',
    'Classic movies hit different on a rainy evening when you can just curl up with a blanket and appreciate the pacing and cinematography of a different era.',
    'Marvel or DC? This debate will never end.',
    'Horror movie marathon this weekend, who is in? We are planning to start with the classics and work our way through the most terrifying modern psychological hits.',
    'That director never misses, every film is a masterpiece.',
    'Subtitled films are underrated, some of the best storytelling in the world is happening outside of Hollywood and people are missing out by being afraid to read.',
    'Rewatched the original trilogy and it still holds up perfectly.',
    'Oscar nominations were surprising this year, with several independent films getting the recognition they deserve while some of the big-budget blockbusters were completely shut out.',
    "Documentaries don't get enough love in my opinion.",
    'The soundtrack made that movie ten times better by creating an emotional resonance that stayed with me long after the credits finished rolling and the lights came up.',
  ],
  'Food & Cooking': [
    'Tried making sourdough from scratch, it actually turned out great.',
    'Best street food you have ever had? Mine was in Bangkok where I found a tiny stall serving the most incredible spicy noodles I have ever tasted in my life.',
    'Cast iron pans are a game changer for everything.',
    'Meal prepping on Sundays saves the entire week by ensuring that I have healthy, delicious options ready to go even when I get home late and feel exhausted.',
    'Hot take: pineapple absolutely belongs on pizza.',
    'Homemade pasta is easier than people think, requiring only a few simple ingredients and a bit of patience to roll out the dough to the perfect consistent thickness.',
    'Found this amazing hole-in-the-wall restaurant downtown.',
    'Air fryer is the best kitchen gadget I have ever bought because it allows me to get that perfect crispy texture without the mess and hassle of deep frying.',
    'Anyone tried fermenting their own kimchi? Tips welcome.',
    'Brunch is the best meal of the week, no contest, because it combines the best parts of breakfast and lunch while giving you an excuse to drink mimosas at noon.',
  ],
}

export const getFullSeedData = async () => {
  const seedUsers = await getFullSeedUsers()
  const rand = seededRandom(42)

  const generalRoom = { roomId: createId(), name: 'General', slug: 'general', type: 'group' as const }
  const seedGroupRooms = [
    generalRoom,
    { roomId: createId(), name: 'Weather Talk', slug: 'weather-talk', type: 'group' as const },
    { roomId: createId(), name: 'Sports Arena', slug: 'sports-arena', type: 'group' as const },
    { roomId: createId(), name: 'Music Lounge', slug: 'music-lounge', type: 'group' as const },
    { roomId: createId(), name: 'Movie Night', slug: 'movie-night', type: 'group' as const },
    { roomId: createId(), name: 'Food & Cooking', slug: 'food-and-cooking', type: 'group' as const },
  ]

  const seedGroupRoomUsers: { userId: string; roomId: string }[] = []
  const userRoomMap = new Map<string, string[]>()

  for (const user of seedUsers) {
    seedGroupRoomUsers.push({ userId: user.userId, roomId: generalRoom.roomId })
  }

  const topicRooms = seedGroupRooms.filter((r) => r.roomId !== generalRoom.roomId)

  for (const user of seedUsers) {
    const numRooms = rand() < 0.5 ? 2 : 3
    const shuffled = [...topicRooms].sort(() => rand() - 0.5)
    const assignedRooms = shuffled.slice(0, numRooms)

    const roomIds: string[] = [generalRoom.roomId]
    for (const room of assignedRooms) {
      seedGroupRoomUsers.push({ userId: user.userId, roomId: room.roomId })
      roomIds.push(room.roomId)
    }
    userRoomMap.set(user.userId, roomIds)
  }

  const privateRooms: { roomId: string; name: string; slug: string; type: 'dm' }[] = []
  const privateRoomUsers: { userId: string; roomId: string }[] = []
  const privateRoomMessages: {
    messageId: string
    clientMsgId: string
    roomId: string
    userId: string
    content: string
  }[] = []

  const primaryUser = seedUsers[0]
  const otherUsers = seedUsers.slice(1)
  const shuffledOthers = [...otherUsers].sort(() => rand() - 0.5)
  const dmPartners = shuffledOthers.slice(0, 5)

  for (const partner of dmPartners) {
    const slug = generateDmSlug(primaryUser.userId, partner.userId)
    const name = generateDmName(primaryUser.username, partner.username)

    const dmRoom = {
      roomId: createId(),
      name,
      slug,
      type: 'dm' as const,
    }
    privateRooms.push(dmRoom)

    privateRoomUsers.push({ userId: primaryUser.userId, roomId: dmRoom.roomId })
    privateRoomUsers.push({ userId: partner.userId, roomId: dmRoom.roomId })

    privateRoomMessages.push({
      messageId: createId(),
      clientMsgId: createId(),
      roomId: dmRoom.roomId,
      userId: primaryUser.userId,
      content: `Hey ${partner.username}, sending you a direct message.`,
    })
    privateRoomMessages.push({
      messageId: createId(),
      clientMsgId: createId(),
      roomId: dmRoom.roomId,
      userId: partner.userId,
      content: `Got it ${primaryUser.username}, DM received.`,
    })
  }

  const allRooms = [...seedGroupRooms, ...privateRooms]

  const groupMessages: {
    messageId: string
    clientMsgId: string
    roomId: string
    userId: string
    content: string
  }[] = []

  for (const room of seedGroupRooms) {
    const messages = roomMessages[room.name] ?? []
    const membersInRoom = seedGroupRoomUsers
      .filter((ru) => ru.roomId === room.roomId)
      .map((ru) => ru.userId)

    for (let i = 0; i < messages.length; i++) {
      const userId = membersInRoom[i % membersInRoom.length]
      groupMessages.push({
        messageId: createId(),
        clientMsgId: createId(),
        roomId: room.roomId,
        userId,
        content: messages[i],
      })
    }
  }

  const allMessages = [...groupMessages, ...privateRoomMessages]
  const allRoomUsers = [...seedGroupRoomUsers, ...privateRoomUsers]

  return {
    users: seedUsers,
    rooms: allRooms,
    messages: allMessages,
    roomUsers: allRoomUsers,
  }
}
