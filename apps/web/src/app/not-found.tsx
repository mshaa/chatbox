'use client'

import { ErrorState } from '@/components/ui/error-state'

export default function NotFound() {
  return (
    <ErrorState
      title="Page Not Found"
      description="The page you are looking for does not exist or has been moved."
      showHome={true}
    />
  )
}
