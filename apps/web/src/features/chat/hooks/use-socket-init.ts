import { useRoomStore } from '@/features/chat/stores/room.store'
import { chatQueries } from '@/lib/queries/factory'
import {
  chatEvents,
  HistoryMessage,
  PaginatedResponse,
  RoomMemberWithStatus,
  ServerEvents,
  UserChats,
} from '@chatbox/contracts'
import { getWebConfig } from '@chatbox/config/web'
import { InfiniteData, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSocketStore } from '../stores/socket.store'
import { useUserProfile } from '@/features/chat/api/use-user-profile'
import { useSocketToken } from '@/features/chat/api/use-socket-token'
import { useAuthStore } from '@/stores/auth.store'

export function useSocketInit() {
  const queryClient = useQueryClient()
  const init = useSocketStore((s) => s.init);
  const destroy = useSocketStore((s) => s.destroy);
  const connect = useSocketStore((s) => s.connect);
  const updateAuth = useSocketStore((s) => s.updateAuth);
  const registerHandlers = useSocketStore((s) => s.registerHandlers);

  const updateLastActivity = useRoomStore((s) => s.updateLastActivity);
  const { data: user } = useUserProfile()
  const sessionId = useAuthStore((s) => s.sessionId)

  const { mutateAsync: fetchToken } = useSocketToken()

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasConnectedOnceRef = useRef(false)

  useEffect(() => {
    if (!sessionId) return

    hasConnectedOnceRef.current = false

    const handlers: Partial<ServerEvents> = {
      [chatEvents.server.socketConnected]: () => {
        useSocketStore.setState({ isConnected: true })

        if (hasConnectedOnceRef.current) {
          // @issue hackish way to prevent new messages gaps on reconnect
          const queries = queryClient.getQueriesData<
            InfiniteData<PaginatedResponse<HistoryMessage>>
          >({
            predicate: (query) =>
              query.queryKey[0] === 'rooms' && query.queryKey[2] === 'history',
          })

          for (const [queryKey, data] of queries) {
            if (!data) continue
            const lastPage = data.pages.at(-1)
            const lastMsg = lastPage?.items.at(-1)
            if (!lastMsg || lastPage?.nextCursor) continue

            queryClient.setQueryData(queryKey, {
              ...data,
              pages: data.pages.map((page, idx) =>
                idx === data.pages.length - 1
                  ? { ...page, nextCursor: lastMsg.messageId }
                  : page,
              ),
            })
          }

          queryClient.refetchQueries(chatQueries['chats.me']).then(() => {
            const chats = queryClient.getQueryData<UserChats>(
              chatQueries['chats.me'].queryKey,
            )
            if (chats) {
              useRoomStore.getState().initUnreadCounters(chats)
            }
          })
        }
        hasConnectedOnceRef.current = true
      },

      [chatEvents.server.socketDisconnected]: () => {
        useSocketStore.setState({ isConnected: false })
      },

      [chatEvents.server.userJoined]: (payload) => {
        const { roomId } = payload
        const queryKey = chatQueries['rooms.members'](roomId).queryKey
        queryClient.invalidateQueries({ queryKey })
      },

      [chatEvents.server.userLeft]: (payload) => {
        const queryKey = chatQueries['rooms.members'](payload.roomId).queryKey
        queryClient.setQueryData(queryKey, (old: RoomMemberWithStatus[] | undefined) =>
          old?.filter((m) => m.userId !== payload.userId),
        )
      },

      [chatEvents.server.userReportedTyping]: (payload) => {
        const { roomId, username, isTyping } = payload
        const { activeRoom, addTypingUser, removeTypingUser } = useRoomStore.getState()

        if (activeRoom?.roomId === roomId) {
          if (isTyping) {
            addTypingUser(username)
          } else {
            removeTypingUser(username)
          }
        }
      },

      [chatEvents.server.userGotOnline]: (payload) => {
        const queryKey = chatQueries['rooms.members'](payload.roomId).queryKey
        queryClient.setQueryData(queryKey, (old: RoomMemberWithStatus[] | undefined) =>
          old?.map((m) => (m.userId === payload.userId ? { ...m, isOnline: true } : m)),
        )
      },

      [chatEvents.server.userGotOffline]: (payload) => {
        const queryKey = chatQueries['rooms.members'](payload.roomId).queryKey
        queryClient.setQueryData(queryKey, (old: RoomMemberWithStatus[] | undefined) =>
          old?.map((m) => (m.userId === payload.userId ? { ...m, isOnline: false } : m)),
        )
      },

      [chatEvents.server.msgReceived]: (parsed) => {
        const { activeRoom, increaseUnreadCount, updateLastActivity, removePendingMessage, setPreviewMessage } =
          useRoomStore.getState()

        const isActiveRoom = activeRoom?.roomId === parsed.roomId

        if (parsed.clientMsgId) {
          removePendingMessage(parsed.roomId, parsed.clientMsgId)
        }

        if (!isActiveRoom) {
          updateLastActivity(parsed.roomId)
          
          if (parsed.userId !== user.userId) {
            setPreviewMessage({
              roomId: parsed.roomId,
              userId: parsed.userId,
              content: parsed.content,
            })
          }
        }

        queryClient.setQueriesData<InfiniteData<PaginatedResponse<HistoryMessage>>>(
          { queryKey: ['rooms', parsed.roomId, 'history'] },
          (old) => {
            if (!old) return undefined

            const messageExists = old.pages.some((page) =>
              page.items.some((m) => m.clientMsgId === parsed.clientMsgId),
            )

            if (messageExists) {
              return old
            }

            const lastPage = old.pages[old.pages.length - 1]
            if (lastPage.nextCursor) return old

            return {
              ...old,
              pages: old.pages.map((page, index) => {
                if (index === old.pages.length - 1) {
                  return {
                    ...page,
                    items: [...page.items, parsed],
                  }
                }
                return page
              }),
            }
          },
        )

        if (parsed.userId !== user.userId) {
          increaseUnreadCount(parsed.roomId)
        }
      },

      [chatEvents.server.roomCreated]: (payload) => {
        if (payload.type == 'dm') {
          queryClient.invalidateQueries(chatQueries['chats.me'])
          updateLastActivity(payload.roomId)
        } else {
          queryClient.invalidateQueries(chatQueries['rooms.discover'])
        }
      },

      [chatEvents.server.socketNotAuthed]: () => {
        destroy()
      },
    }

    let isCancelled = false

    fetchToken()
      .then((data) => {
        if (isCancelled) return

        init(data.socketToken)
        registerHandlers(handlers)
        connect()

        const config = getWebConfig()
        refreshIntervalRef.current = setInterval(async () => {
          const refreshed = await fetchToken()
          updateAuth(refreshed.socketToken)
        }, config.NEXT_PUBLIC_SOCKET_TOKEN_REFRESH_INTERVAL_MS)
      })

    return () => {
      isCancelled = true
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      destroy()
    }
  }, [sessionId, registerHandlers, init, destroy, connect, updateAuth, fetchToken])
}
