import type { ClientEvents, ServerEvents } from '@chatbox/contracts'
import { chatEvents } from '@chatbox/contracts'
import { io, Socket } from 'socket.io-client'
import { v7 as uuidv7 } from 'uuid'
import { getSimulatorAppConfig } from '../config/simulator.config'
import {
  getThematicMessage,
  getResponseMessage,
  type MessageTemplate,
} from '../data/message-pool'
import { refreshAccessToken } from '../lib/auth'

export interface BotUser {
  userId: string
  username: string
  accessToken: string
  refreshToken: string
}

export interface BotRoom {
  roomId: string
  name: string
  type: 'group' | 'dm'
}

export abstract class BaseBot {
  protected socket: Socket<ServerEvents, ClientEvents> | null = null
  protected user: BotUser
  protected rooms: BotRoom[] = []
  protected isActive = false
  protected messageInterval: NodeJS.Timeout | null = null
  protected lastMessages: Map<string, { content: string; requiresResponse: boolean }> = new Map()
  private isRefreshing = false

  constructor(user: BotUser, rooms: BotRoom[]) {
    this.user = user
    this.rooms = rooms
  }

  get username(): string {
    return this.user.username
  }

  get active(): boolean {
    return this.isActive
  }

  protected async authenticatedFetch(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.user.accessToken}`,
      ...options.headers,
    }

    let response = await fetch(url, { ...options, headers })

    if (response.status === 401 && !this.isRefreshing) {
      const refreshed = await this.refreshTokens()
      if (refreshed) {
        headers.Authorization = `Bearer ${this.user.accessToken}`
        response = await fetch(url, { ...options, headers })
      }
    }

    return response
  }

  private async refreshTokens(): Promise<boolean> {
    if (this.isRefreshing) return false

    this.isRefreshing = true
    try {
      console.log(`[${this.user.username}] Refreshing tokens...`)
      const tokens = await refreshAccessToken(this.user.refreshToken)
      this.user.accessToken = tokens.access_token
      this.user.refreshToken = tokens.refresh_token
      console.log(`[${this.user.username}] Tokens refreshed successfully`)

      await this.reconnectSocket()
      return true
    } catch (error) {
      console.error(`[${this.user.username}] Failed to refresh tokens:`, error)
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  private async reconnectSocket(): Promise<void> {
    if (this.socket) {
      this.socket.auth = { token: this.user.accessToken }
      if (this.socket.connected) {
        this.socket.disconnect()
        this.socket.connect()
      }
    }
  }

  async start(): Promise<void> {
    if (this.isActive) {
      return
    }

    this.isActive = true
    await this.connect()
    this.setupEventListeners()
    this.startMessageScheduler()

    console.log(`[${this.user.username}] Bot started`)
  }

  async stop(): Promise<void> {
    if (!this.isActive) {
      return
    }

    this.isActive = false

    if (this.messageInterval) {
      clearInterval(this.messageInterval)
      this.messageInterval = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    console.log(`[${this.user.username}] Bot stopped`)
  }

  protected async connect(): Promise<void> {
    console.log(this.user)
    const config = getSimulatorAppConfig()
    const socket = io(config.chatUrl + config.chatWebsocketUrl, {
      path: config.chatWebsocketPath,
      auth: {
        token: this.user.accessToken,
      },
      transports: ['websocket'],
    })

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        this.socket = socket
        resolve()
      })

      socket.on('connect_error', (error) => {
        reject(new Error(`Connection failed for ${this.user.username}: ${error.message}`))
      })
    })
  }

  protected setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on(chatEvents.server.msgReceived, (data) => {
      if (data.userId === this.user.userId) {
        return
      }

      this.lastMessages.set(data.roomId, {
        content: data.content,
        requiresResponse: this.shouldRespond(data.content),
      })

      this.onMessageReceived(data)
    })

    this.socket.on(chatEvents.server.userReportedTyping, (data) => {
      this.onUserTyping(data)
    })

    this.socket.on(chatEvents.server.socketNotAuthed, async (data) => {
      console.error(`[${this.user.username}] Not authenticated:`, data.message)
      const refreshed = await this.refreshTokens()
      if (!refreshed) {
        console.error(`[${this.user.username}] Token refresh failed, stopping bot`)
        await this.stop()
      }
    })
  }

  protected startMessageScheduler(): void {
    const schedule = () => {
      if (!this.isActive) return

      const interval = this.getNextMessageInterval()
      this.messageInterval = setTimeout(async () => {
        if (this.isActive) {
          try {
            await this.sendRandomMessage()
          } catch (error) {
            console.error(`[${this.user.username}] Error sending message:`, error)
          }
          schedule()
        }
      }, interval)
    }

    schedule()
  }

  protected async sendRandomMessage(): Promise<void> {
    if (!this.socket || this.rooms.length === 0) return

    if (!this.isActiveTime()) {
      return
    }

    const room = this.selectRoom()
    if (!room) return

    const message = this.selectMessage(room.roomId)

    const config = getSimulatorAppConfig()
    await this.sendTypingIndicator(room.roomId, true)
    const typingDuration =
      Math.random() * (config.maxTypingDuration - config.minTypingDuration) +
      config.minTypingDuration
    await this.sleep(typingDuration)

    await this.sendMessage(room.roomId, message.text)
    await this.sendTypingIndicator(room.roomId, false)

  }

  protected async sendMessage(roomId: string, content: string): Promise<void> {
    const clientMsgId = uuidv7()
    const config = getSimulatorAppConfig()

    const response = await this.authenticatedFetch(
      `${config.chatUrl}/rooms/${roomId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, clientMsgId }),
      },
    )

    if (!response.ok) {
      console.error(`[${this.user.username}] Failed to send message to ${roomId}: ${response.statusText}`)
      return
    }

    console.log(`[${this.user.username}] Sent message to ${roomId}: ${content}`)
  }

  protected async sendTypingIndicator(roomId: string, value: boolean): Promise<void> {
    if (!this.socket) return

    this.socket.emit(chatEvents.client.userTyping, {
      roomId,
      isTyping: value,
    })
  }

  protected selectRoom(): BotRoom {
    const config = getSimulatorAppConfig()
    if (config.preSelectedRoom) {
      const preSelectedRoom = this.rooms.find(r => r.name === config.preSelectedRoom)
      if (!preSelectedRoom) {
        throw new Error(`Preselected [${config.preSelectedRoom}] room not found`)
      }
      return preSelectedRoom
    }
    const groups = this.rooms.filter(r => r.type === "group")
    return groups[Math.floor(Math.random() * groups.length)]
  }

  protected selectMessage(roomId: string): MessageTemplate {
    const room = this.rooms.find((r) => r.roomId === roomId)
    const roomName = room?.name || ''

    const lastMsg = this.lastMessages.get(roomId)
    this.lastMessages.delete(roomId)

    const config = getSimulatorAppConfig()
    if (lastMsg && lastMsg.requiresResponse && Math.random() < config.responseChance) {
      return getResponseMessage()
    }

    return getThematicMessage(roomName)
  }

  protected shouldRespond(content: string): boolean {
    return content.trim().endsWith('?')
  }

  protected isActiveTime(): boolean {
    const hour = new Date().getUTCHours()
    const config = getSimulatorAppConfig()
    return hour >= config.activeHoursStart && hour < config.activeHoursEnd
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected abstract getNextMessageInterval(): number
  protected abstract onMessageReceived(data: any): void
  protected abstract onUserTyping(data: any): void
}
