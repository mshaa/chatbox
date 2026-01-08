import { useEffect, useRef } from 'react'
import { useReadRoom } from '../api/use-read-room'
import { useRoomStore } from '../stores/room.store'
import { NIL } from 'uuid'

export const useSaveLastRead = (roomId: string) => {
  const { mutate: readRoom } = useReadRoom(roomId);
  const lastSyncedIdRef = useRef<string>(NIL);

  const localCursorId = useRoomStore((s) => s.lastReadCursors[roomId]);

  useEffect(() => {
    lastSyncedIdRef.current = localCursorId ?? NIL;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !localCursorId) return;
    if (localCursorId <= lastSyncedIdRef.current) return;

    const timer = setTimeout(() => {
      readRoom(localCursorId, {
        onSuccess: () => {
          lastSyncedIdRef.current = localCursorId;
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [localCursorId, roomId, readRoom]);

  useEffect(() => {
    return () => {
      const localCursor = useRoomStore.getState().lastReadCursors[roomId]
      if (localCursor && localCursor > lastSyncedIdRef.current) {
        readRoom(localCursor)
      }
    }
  }, [roomId, readRoom])
}