import { BaseBot } from '../base-bot'
import { getSimulatorAppConfig } from '../../config/simulator.config'

export class LurkerBot extends BaseBot {
  protected getNextMessageInterval(): number {
    const config = getSimulatorAppConfig()
    const min = config.minMessageInterval * 3
    const max = config.maxMessageInterval * 3
    return Math.random() * (max - min) + min
  }

  protected onMessageReceived(data: any): void {
    if (this.shouldRespond(data.content) && Math.random() < 0.1) {
      setTimeout(() => {
        if (this.isActive) {
          this.sendMessage(data.roomId, this.selectMessage(data.roomId).text)
        }
      }, Math.random() * 30000 + 10000)
    }
  }

  protected onUserTyping(data: any): void {
  }

  protected async sendRandomMessage(): Promise<void> {
    if (Math.random() < 0.3) {
      await super.sendRandomMessage()
    }
  }
}
