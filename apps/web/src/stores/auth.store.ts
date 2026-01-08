import { logout as logoutAction } from '@/actions/auth'
import { getQueryClient } from '@/lib/queries/query-client'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AuthState = {
  sessionId: string | null
  setSessionId: (sessionId: string | null) => void
  logout: () => void
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sessionId: null,
      hasHydrated: false, 
      setSessionId: (sid) => set({ sessionId: sid }),
      setHasHydrated: (state) => set({ hasHydrated: state }),

      logout: async () => {
        await logoutAction().catch((err) => console.error('Logout error:', err))

        set({ sessionId: null })

        getQueryClient().clear()

        import('@/features/chat/stores/room.store').then(({ useRoomStore }) => {
          useRoomStore.getState().reset()
        })
        import('@/features/chat/stores/view.store').then(({ useViewStore }) => {
          useViewStore.getState().reset()
        })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true) 
      },
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
