import { BaseBot } from '../base-bot'
import { getSimulatorAppConfig } from '../../config/simulator.config'
import { getGreetingMessage, getFarewellMessage } from '../../data/message-pool'

export class ActiveChatterBot extends BaseBot {
  private sessionMessages = 0
  private readonly maxSessionMessages = Math.floor(Math.random() * 20) + 10

  async start(): Promise<void> {
    await super.start()

    if (this.rooms.length > 0 && this.isActiveTime()) {
      const room = this.selectRoom()
      const greeting = getGreetingMessage()
      await this.sleep(1000)
      await this.sendMessage(room.roomId, greeting.text)
    }
  }

  async stop(): Promise<void> {
    if (this.isActive && this.rooms.length > 0) {
      const room = this.selectRoom()
      const farewell = getFarewellMessage()
      await this.sendMessage(room.roomId, farewell.text)
      await this.sleep(500)
    }

    await super.stop()
  }

  protected getNextMessageInterval(): number {
    const config = getSimulatorAppConfig()
    const min = config.minMessageInterval * 0.25
    const max = config.maxMessageInterval * 0.25
    return Math.random() * (max - min) + min
  }

  protected onMessageReceived(data: any): void {
    if (this.sessionMessages >= this.maxSessionMessages) {
      return
    }

    if (this.shouldRespond(data.content) && Math.random() < 0.8) {
      setTimeout(() => {
        if (this.isActive) {
          this.sendMessage(data.roomId, this.selectMessage(data.roomId).text)
        }
      }, Math.random() * 3000 + 1000)
    }

    this.sessionMessages++

    if (this.sessionMessages >= this.maxSessionMessages) {
      console.log(`[${this.user.username}] Taking a break after ${this.sessionMessages} messages`)
      setTimeout(() => {
        this.sessionMessages = 0
      }, Math.random() * 60000 + 30000)
    }
  }

  protected onUserTyping(data: any): void {
  }
}
