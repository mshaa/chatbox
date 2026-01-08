import { AuthGuard } from '@/components/auth-guard'
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthGuard requireAuth={false}>{children}</AuthGuard>
}
