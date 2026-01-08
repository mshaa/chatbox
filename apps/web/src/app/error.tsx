'use client'

import { ErrorState } from '@/components/ui/error-state'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      title="Application Error"
      description="We encountered an unexpected issue. Our team has been notified."
      retry={reset}
      showHome={true}
    />
  )
}
