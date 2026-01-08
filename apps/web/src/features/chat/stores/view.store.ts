import { create } from 'zustand'

type ViewType = 'chat' | 'profile'

type ViewState = {
  currentView: ViewType
  profileUserId: string | null
  setView: (view: ViewType, userId?: string) => void

  viewAnchorMessageId: string | null
  setViewAnchorMessageId: (id: string | null) => void
  unreadSeparatorId: string | null
  setUnreadSeparatorId: (id: string | null) => void

  showUnreadCount: Record<string, boolean>
  setShowUnreadCount: (roomId: string, show: boolean) => void

  reset: () => void
}

const initialState = {
  currentView: 'chat' as const,
  profileUserId: null,
  viewAnchorMessageId: null as string | null,
  unreadSeparatorId: null as string | null,
  showUnreadCount: {} as Record<string, boolean>,
}

export const useViewStore = create<ViewState>((set) => ({
  ...initialState,

  reset: () => set(initialState),

  setView: (view, userId) => set({ currentView: view, profileUserId: userId || null }),

  setViewAnchorMessageId: (id) => set({ viewAnchorMessageId: id }),

  setUnreadSeparatorId: (id) => set({ unreadSeparatorId: id }),

  setShowUnreadCount: (roomId, show) =>
    set((state) => ({
      showUnreadCount: { ...state.showUnreadCount, [roomId]: show },
    })),
}))
