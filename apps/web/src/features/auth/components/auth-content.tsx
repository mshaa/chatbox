'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthenticate } from '@/hooks/use-auth'
import { SignUp, SignUpSchema } from '@chatbox/contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function AuthContent() {
  const router = useRouter()
  const { mutate: authenticate, isPending } = useAuthenticate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUp>({
    resolver: zodResolver(SignUpSchema),
  })

  const onSubmit = handleSubmit((data) => {
    setServerError(null) // Clear previous errors

    authenticate(data, {
      onSuccess: () => {
        router.push('/chat')
      },
      onError: (error: Error) => {
        if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
          setServerError('Invalid username or password')
        } else {
          setServerError(error.message || 'Authentication failed. Please try again.')
        }
      },
    })
  })

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your username and password to login or create an account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4">
            {serverError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                {...register('username', {
                  onChange: () => setServerError(null),
                })}
                disabled={isPending}
                data-testid="login-username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password', {
                  onChange: () => setServerError(null),
                })}
                disabled={isPending}
                data-testid="login-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full mt-5"
              type="submit"
              disabled={isPending}
              data-testid="login-submit"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
