'use client'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      title="Authentication Error"
      description="We couldn't verify your session or complete the request. Please try again."
      retry={reset}
      showHome={false}
      customAction={
        <Button onClick={() => router.push('/auth')} variant="outline">
          Back to Login
        </Button>
      }
    />
  )
}
