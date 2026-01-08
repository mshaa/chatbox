'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ErrorStateProps = {
  title?: string
  description?: string
  retry?: () => void
  showHome?: boolean
  customAction?: React.ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again later.',
  retry,
  showHome = true,
  customAction,
}: ErrorStateProps) {
  const router = useRouter()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2 min-w-[200px] sm:flex-row justify-center">
        {retry && (
          <Button onClick={retry} variant="default">
            Try Again
          </Button>
        )}
        {showHome && (
          <Button onClick={() => router.push('/')} variant="outline">
            Go to Home
          </Button>
        )}
        {customAction}
      </div>
    </div>
  )
}
