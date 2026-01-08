'use client'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageLoader } from './page-loader'

export function AuthGuard({
  children,
  requireAuth,
  loading,
}: {
  children: React.ReactNode
  requireAuth: boolean
  loading?: React.ReactNode
}) {
  const sessionId = useAuthStore((state) => state.sessionId)
  const isHydrated = useAuthStore((state) => state.hasHydrated) 
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated) return

    if (requireAuth && !sessionId) {
      router.replace('/auth')
    } else if (!requireAuth && sessionId) {
      router.replace('/chat')
    }
  }, [isHydrated, sessionId, requireAuth, router])

  if (!isHydrated) {
    return <>{loading || <PageLoader />}</>
  }

  if (requireAuth && !sessionId) return null
  if (!requireAuth && sessionId) return null

  return <>{children}</>
}
