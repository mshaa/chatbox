import { useSuspenseRoomMembers } from '@/features/chat/api/use-room-members'
import { OptimisticMessage, useRoomStore } from '@/features/chat/stores/room.store'
import { useViewStore } from '../../stores/view.store'
import { cn } from '@/lib/utils'
import { HistoryMessage, RoomMember } from '@chatbox/contracts'
import { memo, RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

interface MessageItemProps {
  message: HistoryMessage | OptimisticMessage;
  chatId: string;
  currentUser: RoomMember;
  rootRef: RefObject<HTMLDivElement | null>;
  unreadSeq: number | null;  
}

type MessageStatus = OptimisticMessage["status"] | "sent"

export const MessageItem = memo(function MessageItem({
  message,
  chatId,
  currentUser,
  rootRef,
  unreadSeq,
}: MessageItemProps) {
  const userId = message.userId;

  const elRef = useRef<HTMLDivElement>(null)
  const wasOwnDraft = useRef(false)

  const setView = useViewStore((s) => s.setView)
  const isAnchor = useViewStore((s) => s.viewAnchorMessageId === message.messageId)
  const showSeparator = useViewStore((s) => s.unreadSeparatorId === message.messageId)

  const { data: member } = useSuspenseRoomMembers(chatId, (members) =>
    userId === currentUser.userId ? currentUser : members.find(m => m.userId === userId)
  );

  const ui = useMemo(() => {
    const isOptimistic = 'status' in message;
    return {
      messageId: message.messageId,
      clientMsgId: message.clientMsgId,
      name: member?.username || 'Unknown',
      avatar: (member?.avatar as string) || '',
      isCurrentUser: userId === currentUser.userId,
      status: isOptimistic ? message.status : 'sent' as MessageStatus,
      timestamp: new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
    };
  }, [message, member, currentUser.userId]);

  const isUnread = unreadSeq !== null && !ui.isCurrentUser;

  const { ref: inViewRef, inView } = useInView({
    root: rootRef.current ?? undefined,
    triggerOnce: true,
    threshold: 1,
  });

  const setRefs = useCallback((node: HTMLDivElement) => {
    elRef.current = node;
    if (isUnread) {
      inViewRef(node);
    }
  }, [inViewRef, isUnread]);

  useEffect(() => {
    if (inView && isUnread && unreadSeq !== null) {
      useRoomStore.getState().increaseReadCount(chatId, unreadSeq);
      useRoomStore.getState().updateLastReadCursor(chatId, ui.messageId);
    }
  }, [inView, isUnread, unreadSeq, chatId, ui.messageId]);

  useEffect(() => {
    if (ui.isCurrentUser && ui.status === 'pending') {
      wasOwnDraft.current = true;
    }
    if (wasOwnDraft.current && ui.status === 'sent') {
      useRoomStore.getState().updateLastReadCursor(chatId, ui.messageId);
      wasOwnDraft.current = false;
    }
  }, [ui.isCurrentUser, ui.status, chatId, ui.messageId]);

  useEffect(() => {
    if (isAnchor) {
      requestAnimationFrame(() => {
        elRef.current?.scrollIntoView({ block: 'end' })
      })
    }
  }, [isAnchor]);

  return (
    <>
      <div
        ref={setRefs}
        data-message-id={message.messageId}
        className={cn(
          'flex items-start gap-4',
          ui.isCurrentUser && 'flex-row-reverse',
          ui.status === 'pending' && 'opacity-70',
          ui.status === 'failed' && 'text-destructive',
          '[overflow-anchor:none]',
          '[contain:content]',
        )}
      >
        <img
          src={ui.avatar}
          alt={ui.name}
          className="size-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover shrink-0 select-none"
          onClick={() => setView('profile', message.userId)}
        />

        <div className={cn('flex flex-col gap-1 w-full', ui.isCurrentUser && 'items-end')}>
          <div className="flex items-center gap-2">
            <div
              className="font-semibold cursor-pointer hover:underline"
              onClick={() => setView('profile', message.userId)}
            >
              {ui.name}
            </div>
            <div className="text-xs text-muted-foreground">{ui.timestamp}</div>
          </div>
          <div
            className={cn(
              'p-3 rounded-lg max-w-[75%] w-fit',
              ui.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
            )}
          >
            <p className="text-sm break-words">{message.content}</p>
          </div>
        </div>
      </div>
      {showSeparator &&
        <div className="flex items-center gap-3 -my-2 [overflow-anchor:none]">
          <div className="flex-1 h-px bg-destructive/30" />
          <span className="text-xs font-medium text-destructive uppercase tracking-wide">
            Unread messages
          </span>
          <div className="flex-1 h-px bg-destructive/30" />
        </div>
      }
    </>
  );
}, (prev, next) => {
  const prevStatus = 'status' in prev.message ? prev.message.status : 'sent';
  const nextStatus = 'status' in next.message ? next.message.status : 'sent';

  return (
    prev.message.messageId === next.message.messageId &&
    prevStatus === nextStatus
  );
});