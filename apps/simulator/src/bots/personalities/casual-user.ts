import { BaseBot } from '../base-bot'
import { getSimulatorAppConfig } from '../../config/simulator.config'

export class CasualUserBot extends BaseBot {
  protected getNextMessageInterval(): number {
    const config = getSimulatorAppConfig()
    return (
      Math.random() * (config.maxMessageInterval - config.minMessageInterval) +
      config.minMessageInterval
    )
  }

  protected onMessageReceived(data: any): void {
    if (this.shouldRespond(data.content) && Math.random() < 0.5) {
      setTimeout(() => {
        if (this.isActive) {
          this.sendMessage(data.roomId, this.selectMessage(data.roomId).text)
        }
      }, Math.random() * 5000 + 2000)
    }
  }

  protected onUserTyping(data: any): void {
  }
}
