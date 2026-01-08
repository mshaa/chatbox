import { type BaseMessage, MESSAGE_PERSISTED_EVENT } from '@chatbox/contracts'
import { Controller, Logger } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { ChatGateway } from '../gateway/chat.gateway'

@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name)

  constructor(private readonly gateway: ChatGateway) {}

  @MessagePattern(MESSAGE_PERSISTED_EVENT)
  handleMessagePersisted(@Payload() data: BaseMessage) {
    this.gateway.emitMessageReceived(data)
    this.logger.debug({ messageId: data.messageId }, 'Message posted')
  }
}
