'use client'

import { ErrorState } from '@/components/ui/error-state'
import { useAuthStore } from '@/stores/auth.store'
import { useEffect } from 'react'

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { logout } = useAuthStore()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      title="Chat Error"
      description="We encountered an issue loading your chat. Please try refreshing."
      retry={() => {
        logout()
        reset()
      }}
      showHome={true}
    />
  )
}
