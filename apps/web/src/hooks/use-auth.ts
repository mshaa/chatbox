import { chatMutations } from '@/lib/queries/factory'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@tanstack/react-query'

export const useAuthenticate = () => {
  const { setSessionId } = useAuthStore()
  return useMutation({
    ...chatMutations['auth.authenticate'],
    onSuccess: (result) => setSessionId(result.sessionId),
  })
}

export const useSignOut = () => {
  const { logout } = useAuthStore()
  return { signOut: logout }
}
