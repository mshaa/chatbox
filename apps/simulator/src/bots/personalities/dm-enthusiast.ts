import { BaseBot, type BotRoom } from '../base-bot'
import { getSimulatorAppConfig } from '../../config/simulator.config'

export class DMEnthusiastBot extends BaseBot {
  protected getNextMessageInterval(): number {
    const config = getSimulatorAppConfig()
    const min = config.minMessageInterval * 0.5
    const max = config.maxMessageInterval * 0.5
    return Math.random() * (max - min) + min
  }

  protected selectRoom(): BotRoom {
    const dmRooms = this.rooms.filter((r) => r.type === 'dm')
    if (dmRooms.length === 0) {
      throw new Error("No rooms selected")
    }
    return dmRooms[Math.floor(Math.random() * dmRooms.length)]
  }

  protected onMessageReceived(data: any): void {
    const room = this.rooms.find((r) => r.roomId === data.roomId)
    const responseChance = room?.type === 'dm' ? 0.7 : 0.4

    if (this.shouldRespond(data.content) && Math.random() < responseChance) {
      setTimeout(() => {
        if (this.isActive) {
          this.sendMessage(data.roomId, this.selectMessage(data.roomId).text)
        }
      }, Math.random() * 4000 + 1000)
    }
  }

  protected onUserTyping(data: any): void {
    const room = this.rooms.find((r) => r.roomId === data.roomId)
    if (room?.type === 'dm') {
    }
  }
}
