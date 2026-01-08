import {
  API_ROUTES,
  BaseRoomSchema,
  BaseUserSchema,
  DiscoverRoomsSchema,
  HistoryMessageSchema,
  PaginatedResponseSchema,
  PostMessageResponseSchema,
  RoomMemberWithStatusSchema,
  UserChatsSchema,
  UserJoinedSchema,
  UserLeftSchema,
} from '@chatbox/contracts'
import { AuthGuard, Public, Scopes, type AuthRequest } from '@chatbox/nest-auth'
import { ValidateResponse } from '@chatbox/nest-infra'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { z } from 'zod'
import {
  CreateRoomDmDto,
  CreateRoomGroupDto,
  PaginationDto,
  PostMessageDto,
  ReadRoomDto,
} from '../dto/chat.dto'
import { ChatService } from '../services/chat.service'
import { PagerService } from '../services/pager.service'
import { RoomService } from '../services/room.service'
import { UserService } from '../services/user.service'

@Controller()
@UseGuards(AuthGuard(Scopes.API))
export class HTTPController {
  private readonly logger = new Logger(HTTPController.name)

  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    private readonly pagerService: PagerService,
  ) { }

  @Public()
  @Get(API_ROUTES.HEALTH)
  @HttpCode(204)
  health(): void {}

  @HttpCode(200)
  @Post(API_ROUTES.ROOMS.BY_ID.READ(':roomId'))
  async readRoom(
    @Param('roomId') roomId: string,
    @Body() { messageId }: ReadRoomDto,
    @Req() { user }: AuthRequest,
  ) {
    this.logger.debug({ roomId, userId: user.sub, messageId }, 'Marking room as read')
    await this.roomService.updateLastRead(user.sub, roomId, messageId)
    return {}
  }

  @ValidateResponse(BaseUserSchema)
  @Get(API_ROUTES.USERS.ME)
  async getMe(@Req() { user }: AuthRequest) {
    this.logger.debug({ userId: user.sub }, 'Getting user profile')
    return this.userService.getUserProfile(user.sub)
  }

  @ValidateResponse(BaseUserSchema)
  @Get(API_ROUTES.USERS.BY_ID(':userId'))
  async getUser(@Param('userId') userId: string) {
    this.logger.debug({ userId }, 'Getting user profile by ID')
    return this.userService.getUserProfile(userId)
  }

  @ValidateResponse(DiscoverRoomsSchema)
  @Get(API_ROUTES.ROOMS.DISCOVER)
  async discoverRooms() {
    this.logger.debug('Discovering rooms')
    const rooms = await this.roomService.findDiscoverableRooms()
    this.logger.debug({ count: rooms.length }, 'Discoverable rooms found')
    return rooms
  }

  @ValidateResponse(BaseRoomSchema)
  @Post(API_ROUTES.ROOMS.GROUP)
  async createRoom(@Body() { name }: CreateRoomGroupDto, @Req() { user }: AuthRequest) {
    this.logger.debug({ name, userId: user.sub }, 'Creating group room')
    const room = await this.roomService.createRoomGroup({ name })
    await this.roomService.joinRoom(room.roomId, user.sub)
    this.logger.debug({ room }, 'Room created and user joined')
    return room
  }

  @ValidateResponse(BaseRoomSchema)
  @Post(API_ROUTES.ROOMS.DM)
  async createDM(@Body() { targetUserId, content, clientMsgId }: CreateRoomDmDto, @Req() { user }: AuthRequest) {
    this.logger.debug({ targetUserId }, 'Creating DM room')
    const room = await this.roomService.createRoomDm(user.sub, targetUserId)
    await this.chatService.postMessage(room.roomId, user.sub, content, clientMsgId)
    this.logger.debug({ roomId: room.roomId }, 'DM room created')
    return room
  }

  @HttpCode(200)
  @ValidateResponse(UserJoinedSchema)
  @Post(API_ROUTES.ROOMS.BY_ID.JOIN(':roomId'))
  async joinRoom(@Param('roomId') roomId: string, @Req() { user }: AuthRequest) {
    this.logger.debug({ roomId, userId: user.sub }, 'User joining room')
    await this.roomService.joinRoom(roomId, user.sub)
    this.logger.debug({ roomId, userId: user.sub }, 'User joined room')
    return { roomId, userId: user.sub }
  }

  @HttpCode(200)
  @ValidateResponse(UserLeftSchema)
  @Post(API_ROUTES.ROOMS.BY_ID.LEAVE(':roomId'))
  async leaveRoom(@Param('roomId') roomId: string, @Req() { user }: AuthRequest) {
    this.logger.debug({ roomId, userId: user.sub }, 'User leaving room')
    await this.roomService.leaveRoom(roomId, user.sub)
    this.logger.debug({ roomId, userId: user.sub }, 'User left room')
    return { roomId, userId: user.sub }
  }

  @ValidateResponse(PaginatedResponseSchema(HistoryMessageSchema))
  @Get(API_ROUTES.ROOMS.BY_ID.MESSAGES(':roomId'))
  async getRoomHistory(@Param('roomId') roomId: string, @Query() query: PaginationDto) {
    this.logger.debug({ roomId, query }, 'Getting room history')
    const { limit, cursor, anchor, direction } = query
    const messages = await this.roomService.getRoomHistory(roomId, limit, { cursor, anchor, direction })
    return this.pagerService.paginate(messages, {
      limit,
      cursor,
      anchor,
      direction,
      getCursor: (m) => m.messageId,
    })
  }

  @ValidateResponse(z.array(RoomMemberWithStatusSchema))
  @Get(API_ROUTES.ROOMS.BY_ID.MEMBERS(':roomId'))
  async getRoomMembers(@Param('roomId') roomId: string) {
    this.logger.debug({ roomId }, 'Getting room members')
    return this.roomService.getRoomMembers(roomId)
  }

  @HttpCode(202)
  @ValidateResponse(PostMessageResponseSchema)
  @Post(API_ROUTES.ROOMS.BY_ID.MESSAGES(':roomId'))
  async postMessage(
    @Param('roomId') roomId: string,
    @Req() { user }: AuthRequest,
    @Body() { content, clientMsgId }: PostMessageDto,
  ) {
    this.logger.debug({ roomId, userId: user.sub, clientMsgId }, 'Posting message')
    const payload = await this.chatService.postMessage(roomId, user.sub, content, clientMsgId)
    return {
      messageId: payload.messageId,
      content: payload.content,
      clientMsgId: payload.clientMsgId,
    }
  }

  @ValidateResponse(UserChatsSchema)
  @Get(API_ROUTES.USERS.ME_CHATS)
  async getUserChats(@Req() { user }: AuthRequest) {
    this.logger.debug({ userId: user.sub }, 'Getting user chats')
    const chats = await this.userService.getUserChats(user.sub)
    this.logger.debug({ userId: user.sub, count: chats.length }, 'User chats retrieved')
    return chats
  }
}
