'use client'

import { useSaveLastRead } from '@/features/chat/hooks/use-save-last-read'
import { useUserActive } from '@/features/chat/hooks/use-user-active'
import { memo, useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { useRoomHistory } from '../../api/use-room-history'
import { useUserProfile } from '../../api/use-user-profile'
import { useRoomStore } from '../../stores/room.store'
import { useViewStore } from '../../stores/view.store'
import { MessageItem } from './message-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { chatQueries } from '@/lib/queries/factory'

const getElementByMsgId = (id: string) => {
  return document.querySelector<HTMLElement>(`[data-message-id="${id}"]`)
}

export const TypingIndicator = memo(function TypingIndicator({ chatId }: { chatId: string }) {
  const typingUsers = useRoomStore((s) => s.typingUsers); // Now only this <div> re-renders
  if (!typingUsers?.length) return null;
  return <div className="text-sm text-muted-foreground [overflow-anchor:none]">
    {typingUsers.join(", ")}{" "}
    {typingUsers.length > 1 ? "are" : "is"} typing...
  </div>
})

export const UnreadBadge = memo(function UnreadBadge({ chatId }: { chatId: string }) {
  const unreadCount = useRoomStore((s) => s.unreadCounts[chatId]);
  const showUnreadCount = useViewStore((s) => s.showUnreadCount[chatId] ?? true);
  if (!unreadCount || !showUnreadCount) return null;
  return (
    <Badge
      variant="destructive"
      className="absolute -top-2 -right-2 z-20 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
    >
      {unreadCount > 999 ? '999+' : unreadCount}
    </Badge>
  );
});

export const MessageList = memo(function MessageList({ chatId }: { chatId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomElRef = useRef<HTMLDivElement>(null)
  const firstMsgRef = useRef<string>(null)
  const lastMsgRef = useRef<string>(null)

  const pendingMessages = useRoomStore((s) => s.pendingMessages[chatId])
  const baseLastReadId = useRoomStore((s) => s.baseLastReadIds[chatId])
  const setViewAnchorMessageId = useViewStore((s) => s.setViewAnchorMessageId)
  const setUnreadSeparatorId = useViewStore((s) => s.setUnreadSeparatorId)
  const setShowUnreadCount = useViewStore((s) => s.setShowUnreadCount)

  const { data: user } = useUserProfile()
  const queryClient = useQueryClient()

  const initialLastReadId = useMemo(() => {
    return useRoomStore.getState().lastReadCursors[chatId]
  }, [chatId])

  const {
    data: history,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useRoomHistory(chatId, initialLastReadId)

  const messages = useMemo(() => {
    const historyMessages = history?.pages.flatMap((page) => page.items) ?? [];
    const historyClientIds = new Set(historyMessages.map(m => m.messageId));
    const filteredPending = pendingMessages ? pendingMessages.filter(
      m => !historyClientIds.has(m.messageId)
    ) : []
    return [...historyMessages, ...filteredPending];
  }, [history, pendingMessages]);

  let baseLastReadMsgIdx = useMemo(() => {
    return baseLastReadId
      ? messages.findIndex((m) => m.messageId === baseLastReadId)
      : -1
  }, [baseLastReadId]);

  const { ref: prevSentinelRef, inView: prevSentinelInView } = useInView({
    root: containerRef.current,
  })
  const { ref: nextSentinelRef, inView: nextSentinelInView } = useInView({
    root: containerRef.current,
  })

  const jumpToBottom = useCallback(async () => {
    if (hasNextPage) {
      const queryOptions = chatQueries['rooms.history'](chatId)
      const freshData = await queryOptions.queryFn({ pageParam: null })
      queryClient.setQueryData(queryOptions.queryKey, {
        pages: [freshData],
        pageParams: [null],
      })

      const lastMsg = freshData.items.at(-1)
      if (lastMsg) {
        useRoomStore.getState().resetUnreadCount(chatId, lastMsg.messageId)
        baseLastReadMsgIdx = freshData.items.length - 1
        useRoomStore.getState().updateLastReadCursor(chatId, lastMsg.messageId);
      }
    }
    requestAnimationFrame(() => {
      bottomElRef?.current?.scrollIntoView()
    })
  }, [hasNextPage, chatId, queryClient])

  useLayoutEffect(() => {
    setViewAnchorMessageId(initialLastReadId ?? null)
    const lastMessageId = messages.at(-1)?.messageId
    const hasUnread = hasNextPage || (initialLastReadId && lastMessageId && initialLastReadId < lastMessageId)
    setUnreadSeparatorId(hasUnread ? initialLastReadId ?? null : null)

    return () => {
      setShowUnreadCount(chatId, true)
    }
  }, [chatId])

  const handleUserReturns = useEffectEvent(() => {
    const lastRead = useRoomStore.getState().lastReadCursors[chatId]
    const lastMessageId = messages.at(-1)?.messageId
    const hasUnread = hasNextPage || (lastRead && lastMessageId && lastRead < lastMessageId)
    if (lastRead && hasUnread) {
      setUnreadSeparatorId(lastRead)
    }
  })

  useUserActive(handleUserReturns)

  useEffect(() => {
    if (prevSentinelInView && hasPreviousPage && !isFetchingPreviousPage) {
      firstMsgRef.current = messages[0].messageId
      fetchPreviousPage()
    }
  }, [prevSentinelInView])

  useEffect(() => {
    if (pendingMessages) return
    if (messages.length && firstMsgRef.current && firstMsgRef.current != messages[0].messageId && hasPreviousPage) {
      requestAnimationFrame(() => {
        const el = getElementByMsgId(firstMsgRef.current!)
        el?.scrollIntoView({ block: "start" })
        firstMsgRef.current = null
      })
    }
  }, [messages])

  useEffect(() => {
    if (nextSentinelInView && hasNextPage && !isFetchingNextPage) {
      lastMsgRef.current = messages[messages.length - 1].messageId
      fetchNextPage()
    }
  }, [nextSentinelInView])

  useLayoutEffect(() => {
    if (pendingMessages) return
    if (messages.length && lastMsgRef.current && lastMsgRef.current != messages[messages.length - 1].messageId) {
      requestAnimationFrame(() => {
        const el = getElementByMsgId(lastMsgRef.current!)
        el?.scrollIntoView({ block: "end" })
        lastMsgRef.current = null
      })
    }
  }, [messages])

  useEffect(() => {
    if (!pendingMessages) return
    if (hasNextPage && pendingMessages.length > 0) {
      jumpToBottom()
    }
  }, [pendingMessages, hasNextPage])

  // @issue: causes flicker on getting back to room due to wrong nextSentinelInView trigger on mount
  useLayoutEffect(() => {
    const isAtBottom = nextSentinelInView && !hasNextPage
    setShowUnreadCount(chatId, !isAtBottom)
  }, [nextSentinelInView, hasNextPage, chatId, setShowUnreadCount])

  useSaveLastRead(chatId)

  return (
    <div className="relative min-h-0 flex-1 w-full chat-bg">
      {messages.length > 0 &&
        <div
          ref={containerRef}
          className="flex flex-col p-4 gap-4 h-full w-full overflow-y-auto hover-scroll"
        >
          <div ref={prevSentinelRef} className="h-px -mt-4 [overflow-anchor:none]" />

          {messages.map((message, index) => {
            const unreadSeq = baseLastReadMsgIdx !== -1
              ? (index > baseLastReadMsgIdx ? index - baseLastReadMsgIdx : null)
              : index + 1;

            return (
              <MessageItem
                key={message.clientMsgId}
                chatId={chatId}
                rootRef={containerRef}
                message={message}
                currentUser={user}
                unreadSeq={unreadSeq}
              />
            );
          })}

          <div ref={nextSentinelRef} className="h-px -mt-4 [overflow-anchor:none]" />
          <div ref={bottomElRef} className='-mt-4 [overflow-anchor:auto] min-h-1' />

          <TypingIndicator chatId={chatId} />
        </div>
      }

      {(!nextSentinelInView || hasNextPage) && (
        <div className="absolute bottom-4 right-4 z-10">
          <UnreadBadge chatId={chatId} />
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-md cursor-pointer"
            onClick={() => {
              jumpToBottom()
            }}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
})                    