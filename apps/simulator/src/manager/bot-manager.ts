import { rooms, roomUsers, users } from '@chatbox/persistence/schema'
import { eq } from 'drizzle-orm'
import { BaseBot, type BotRoom, type BotUser } from '../bots/base-bot'
import {
  ActiveChatterBot,
  CasualUserBot,
  DMEnthusiastBot,
  LurkerBot,
} from '../bots/personalities'
import { getSimulatorAppConfig } from '../config/simulator.config'
import { loginBot } from '../lib/auth'
import { getDatabase } from '../lib/database'

type BotPersonality = 'activeChatter' | 'casualUser' | 'lurker' | 'dmEnthusiast'

const BOT_ROTATION_INTERVAL_MS = 5 * 60 * 1000
const BOT_ROTATION_DELAY_MS = 2000

export class BotManager {
  private bots: BaseBot[] = []
  private activeBots: BaseBot[] = []
  private inactiveBots: BaseBot[] = []
  private isRunning = false
  private rotationInterval: NodeJS.Timeout | null = null

  async initialize(): Promise<void> {
    console.log('Initializing bot manager...')

    const db = getDatabase()
    const config = getSimulatorAppConfig()

    const allUsers = await db.select().from(users)

    const botUsers = allUsers
      .filter((user) => user.username !== 'user_no_rooms' && !user.username.startsWith('test-'))
      .slice(0, config.maxBots)

    console.log(
      `Found ${allUsers.length} total users, using ${botUsers.length} for simulation (max: ${config.maxBots})`,
    )

    for (const user of botUsers) {
      const personality = this.assignPersonality()

      const userRoomIds = await db
        .select({ roomId: roomUsers.roomId })
        .from(roomUsers)
        .where(eq(roomUsers.userId, user.userId))

      const userRooms: BotRoom[] = []
      for (const { roomId } of userRoomIds) {
        const [room] = await db.select().from(rooms).where(eq(rooms.roomId, roomId)).limit(1)
        if (room) {
          userRooms.push({
            roomId: room.roomId,
            name: room.name,
            type: room.type,
          })
        }
      }

      if (userRooms.length === 0) {
        console.log(`Skipping ${user.username} - no rooms found`)
        continue
      }


      try {
        const { access_token, refresh_token } = await loginBot(user.username)
        const botUser: BotUser = {
          userId: user.userId,
          username: user.username,
          accessToken: access_token,
          refreshToken: refresh_token,
        }

        const bot = this.createBot(personality, botUser, userRooms)
        this.bots.push(bot)
        this.inactiveBots.push(bot)

        console.log(
          `Created ${personality} bot for ${user.username} in ${userRooms.length} room(s)`,
        )
      } catch (e) {
        console.log(`Skipping bot for [${user.username}]`, e)
        continue
      }
    }

    console.log(`Bot manager initialized with ${this.bots.length} bots`)
  }

  private assignPersonality(): BotPersonality {
    const rand = Math.random()
    let cumulative = 0
    const config = getSimulatorAppConfig()

    for (const [personality, probability] of Object.entries(config.botDistribution)) {
      cumulative += probability
      if (rand < cumulative) {
        return personality as BotPersonality
      }
    }

    return 'casualUser'
  }

  private createBot(personality: BotPersonality, user: BotUser, rooms: BotRoom[]): BaseBot {
    switch (personality) {
      case 'activeChatter':
        return new ActiveChatterBot(user, rooms)
      case 'casualUser':
        return new CasualUserBot(user, rooms)
      case 'lurker':
        return new LurkerBot(user, rooms)
      case 'dmEnthusiast':
        return new DMEnthusiastBot(user, rooms)
      default:
        return new CasualUserBot(user, rooms)
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Bot manager is already running')
      return
    }

    this.isRunning = true
    const config = getSimulatorAppConfig()
    const initialBotCount = Math.min(config.maxBots, this.inactiveBots.length)

    console.log(`Starting ${initialBotCount} bots...`)

    for (let i = 0; i < initialBotCount; i++) {
      const bot = this.inactiveBots.shift()
      if (!bot) break

      await new Promise((resolve) => setTimeout(resolve, 1000 * i))
      await bot.start()
      this.activeBots.push(bot)
    }

    console.log(`${this.activeBots.length} bots started, ${this.inactiveBots.length} in reserve`)

    this.startRotation()
  }

  private startRotation(): void {
    if (this.rotationInterval) return

    this.rotationInterval = setInterval(async () => {
      if (!this.isRunning) return
      await this.rotateRandomBot()
    }, BOT_ROTATION_INTERVAL_MS)

    console.log(`Bot rotation scheduled every ${BOT_ROTATION_INTERVAL_MS / 1000}s`)
  }

  private async rotateRandomBot(): Promise<void> {
    if (this.activeBots.length === 0 || this.inactiveBots.length === 0) {
      return
    }

    const stopIndex = Math.floor(Math.random() * this.activeBots.length)
    const botToStop = this.activeBots[stopIndex]

    const startIndex = Math.floor(Math.random() * this.inactiveBots.length)
    const botToStart = this.inactiveBots[startIndex]

    console.log(`[Rotation] Stopping ${botToStop.username}, starting ${botToStart.username}`)

    await botToStop.stop()
    this.activeBots.splice(stopIndex, 1)
    this.inactiveBots.push(botToStop)

    await new Promise((resolve) => setTimeout(resolve, BOT_ROTATION_DELAY_MS))

    this.inactiveBots.splice(startIndex, 1)
    await botToStart.start()
    this.activeBots.push(botToStart)

    console.log(`[Rotation] Complete. Active: ${this.activeBots.length}, Reserve: ${this.inactiveBots.length}`)
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Bot manager is not running')
      return
    }

    this.isRunning = false

    if (this.rotationInterval) {
      clearInterval(this.rotationInterval)
      this.rotationInterval = null
    }

    console.log('Stopping all bots...')

    await Promise.all(this.activeBots.map((bot) => bot.stop()))

    this.inactiveBots.push(...this.activeBots)
    this.activeBots = []

    console.log('All bots stopped')
  }

  getStatus(): {
    totalBots: number
    activeBots: number
    reserveBots: number
    isRunning: boolean
  } {
    return {
      totalBots: this.bots.length,
      activeBots: this.activeBots.length,
      reserveBots: this.inactiveBots.length,
      isRunning: this.isRunning,
    }
  }
}
