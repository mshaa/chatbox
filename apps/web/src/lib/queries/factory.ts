import { authenticate as authenticateAction, getSocketToken as getSocketTokenAction } from '@/actions/auth'
import { fetchJson, FetchError } from '@/lib/fetch'
import { useAuthStore } from '@/stores/auth.store'
import { getWebConfig } from '@chatbox/config/web'
import {
  API_ROUTES,
  BaseUser,
  BaseUserSchema,
  CreateRoomDm,
  CreateRoomGroup,
  type CursorPagination,
  DiscoverRooms,
  DiscoverRoomsSchema,
  HistoryMessageSchema,
  PaginatedResponseSchema,
  PostMessageResponseSchema,
  PostMessageSchema,
  ReadRoomSchema,
  RoomCreatedSchema,
  RoomMemberWithStatus,
  RoomMemberWithStatusSchema,
  SignIn,
  UserChats,
  UserChatsSchema,
  UserJoinedSchema,
  UserLeftSchema,
} from '@chatbox/contracts'
import z from 'zod'

type HistoryPageParam = Omit<CursorPagination, 'limit'> | null

const fetchApi = async <T extends z.ZodType>(
  url: string,
  schema: T,
  options?: RequestInit,
): Promise<z.infer<T>> => {
  try {
    return await fetchJson(`/api${url}`, schema, {
      ...options,
      credentials: 'include',
      unwrapSuccess: true,
    })
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      useAuthStore.getState().logout()
    }
    throw error
  }
}

const fetchUserProfile = (): Promise<BaseUser> => {
  return fetchApi(API_ROUTES.USERS.ME, BaseUserSchema)
}

const fetchUserById = (userId: string): Promise<BaseUser> => {
  return fetchApi(API_ROUTES.USERS.BY_ID(userId), BaseUserSchema)
}

const fetchUserChats = (): Promise<UserChats> => {
  return fetchApi(API_ROUTES.USERS.ME_CHATS, UserChatsSchema)
}

const fetchDiscoverRooms = (): Promise<DiscoverRooms> => {
  return fetchApi(API_ROUTES.ROOMS.DISCOVER, DiscoverRoomsSchema)
}

const fetchRoomHistory = (roomId: string, pageParam: HistoryPageParam) => {
  const params = new URLSearchParams()
  const config = getWebConfig()
  params.append('limit', String(config.NEXT_PUBLIC_PAGE_SIZE))

  if (pageParam) {
    if (pageParam.anchor) params.append('anchor', pageParam.anchor)
    if (pageParam.cursor) params.append('cursor', pageParam.cursor)
    if (pageParam.direction) params.append('direction', pageParam.direction)
  }

  return fetchApi(
    `${API_ROUTES.ROOMS.BY_ID.MESSAGES(roomId)}?${params.toString()}`,
    PaginatedResponseSchema(HistoryMessageSchema),
  )
}

const fetchRoomMembers = (roomId: string): Promise<RoomMemberWithStatus[]> => {
  return fetchApi(API_ROUTES.ROOMS.BY_ID.MEMBERS(roomId), z.array(RoomMemberWithStatusSchema))
}

const createRoomGroup = (data: CreateRoomGroup) => {
  return fetchApi(API_ROUTES.ROOMS.GROUP, RoomCreatedSchema, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const createRoomDm = (data: CreateRoomDm) => {
  return fetchApi(API_ROUTES.ROOMS.DM, RoomCreatedSchema, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const joinRoom = (roomId: string) => {
  return fetchApi(API_ROUTES.ROOMS.BY_ID.JOIN(roomId), UserJoinedSchema, {
    method: 'POST',
  })
}

const leaveRoom = (roomId: string) => {
  return fetchApi(API_ROUTES.ROOMS.BY_ID.LEAVE(roomId), UserLeftSchema, {
    method: 'POST',
  })
}

const postMessage = ({
  roomId,
  content,
  clientMsgId,
}: {
  roomId: string
  content: string
  clientMsgId: string
}) => {
  return fetchApi(API_ROUTES.ROOMS.BY_ID.MESSAGES(roomId), PostMessageResponseSchema, {
    method: 'POST',
    body: JSON.stringify(PostMessageSchema.parse({ content, clientMsgId })),
  })
}

const readRoom = (roomId: string, messageId: string) => {
  return fetchApi(API_ROUTES.ROOMS.BY_ID.READ(roomId), z.object({}), {
    method: 'POST',
    body: JSON.stringify(ReadRoomSchema.parse({ messageId })),
  })
}

export const chatQueries = {
  'users.me': {
    queryKey: ['users', 'me'] as const,
    queryFn: fetchUserProfile,
  },
  'users.byId': (userId: string) => ({
    queryKey: ['users', userId] as const,
    queryFn: () => fetchUserById(userId),
  }),
  'chats.me': {
    queryKey: ['chats', 'me'] as const,
    queryFn: fetchUserChats,
  },
  'rooms.discover': {
    queryKey: ['rooms', 'discover'] as const,
    queryFn: fetchDiscoverRooms,
  },
  'rooms.history': (roomId: string, initialAnchor?: string | null) => ({
    queryKey: ['rooms', roomId, 'history'] as const,
    queryFn: ({ pageParam }: { pageParam: HistoryPageParam }) => fetchRoomHistory(roomId, pageParam),
    initialPageParam: (initialAnchor ? { anchor: initialAnchor } : null) as HistoryPageParam,
    getNextPageParam: (lastPage: { nextCursor?: string | null }): HistoryPageParam | undefined =>
      lastPage.nextCursor ? { cursor: lastPage.nextCursor, direction: 'next' } : undefined,
    getPreviousPageParam: (firstPage: { prevCursor?: string | null }): HistoryPageParam | undefined =>
      firstPage.prevCursor ? { cursor: firstPage.prevCursor, direction: 'prev' } : undefined,
    staleTime: Infinity,  
    gcTime: Infinity,     
  }),
  'rooms.members': (roomId: string) => ({
    queryKey: ['rooms', roomId, 'members'] as const,
    queryFn: () => fetchRoomMembers(roomId),
  }),
}

export const chatMutations = {
  'auth.authenticate': {
    mutationKey: ['auth', 'authenticate'] as const,
    mutationFn: (credentials: SignIn) => authenticateAction(credentials),
  },
  'auth.socketToken': {
    mutationKey: ['auth', 'socket-token'] as const,
    mutationFn: () => getSocketTokenAction(),
  },
  'rooms.createGroup': {
    mutationKey: ['rooms', 'create', 'group'] as const,
    mutationFn: createRoomGroup,
  },
  'rooms.createDm': {
    mutationKey: ['rooms', 'create', 'dm'] as const,
    mutationFn: createRoomDm,
  },
  'rooms.join': {
    mutationKey: ['rooms', 'join'] as const,
    mutationFn: (roomId: string) => joinRoom(roomId),
  },
  'rooms.leave': (roomId: string) => ({
    mutationKey: ['rooms', roomId, 'leave'] as const,
    mutationFn: () => leaveRoom(roomId),
  }),
  'rooms.postMessage': (roomId: string) => ({
    mutationKey: ['rooms', roomId, 'messages', 'post'] as const,
    mutationFn: ({ content, clientMsgId }: { content: string; clientMsgId: string }) =>
      postMessage({ roomId, content, clientMsgId }),
  }),
  'rooms.read': (roomId: string) => ({
    mutationKey: ['rooms', roomId, 'read'] as const,
    mutationFn: (messageId: string) => readRoom(roomId, messageId),
  }),
}
