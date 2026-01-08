import { Module } from '@nestjs/common'
import { DrizzleProvider, DrizzleService } from './providers/drizzle.provider'
import { MessageService } from './services/message.service'
import { RoomService } from './services/room.service'
import { UserService } from './services/user.service'

@Module({
  providers: [DrizzleService, DrizzleProvider, UserService, RoomService, MessageService],
  exports: [UserService, RoomService, MessageService, DrizzleService, DrizzleProvider],
})
export class PersistenceModule {}
