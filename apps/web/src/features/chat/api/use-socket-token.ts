import { chatMutations } from '@/lib/queries/factory'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@tanstack/react-query'

/**
 * Hook for fetching socket authentication token
 * Returns a mutation that fetches a short-lived token for WebSocket auth
 */
export function useSocketToken() {
  return useMutation({
    ...chatMutations['auth.socketToken'],
    onError: (err) => {
      console.error('Failed to get socket token', err)
      useAuthStore.getState().logout()
    },
  })
}
