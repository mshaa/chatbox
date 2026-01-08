import {
  BaseMessageSchema,
  BaseRoomSchema,
  CreateRoomDmSchema,
  CreateRoomGroupSchema,
  CursorPaginationSchema,
  MsgReceivedSchema,
  MsgSendSchema,
  PostMessageSchema,
  ReadRoomSchema,
  RoomCreatedSchema,
  UserJoinedSchema,
  UserLeftSchema,
  UserTypingCompactSchema,
  UserTypingSchema,
} from '@chatbox/contracts'
import { createZodDto } from 'nestjs-zod'

// REST
export class PaginationDto extends createZodDto(CursorPaginationSchema) {}
export class CreateRoomGroupDto extends createZodDto(CreateRoomGroupSchema) {}
export class CreateRoomDmDto extends createZodDto(CreateRoomDmSchema) {}
export class PostMessageDto extends createZodDto(PostMessageSchema) {}
export class ReadRoomDto extends createZodDto(ReadRoomSchema) {}
export class MessageDto extends createZodDto(BaseMessageSchema) {}
export class RoomDto extends createZodDto(BaseRoomSchema) {}

// Sockets
// client -> server
export class MessageSendDto extends createZodDto(MsgSendSchema) {}
export class UserTypingCompactDto extends createZodDto(UserTypingCompactSchema) {}

// server -> client
export class UserJoinedDto extends createZodDto(UserJoinedSchema) {}
export class UserLeftDto extends createZodDto(UserLeftSchema) {}
export class RoomCreatedDto extends createZodDto(RoomCreatedSchema) {}
export class MessageReceivedDto extends createZodDto(MsgReceivedSchema) {}
export class UserTypingDto extends createZodDto(UserTypingSchema) {}
