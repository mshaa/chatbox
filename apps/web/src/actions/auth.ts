'use server'

import { fetchJson, FetchError } from '@/lib/fetch'
import {
  API_ROUTES,
  AuthResponseSchema,
  BaseUser,
  BaseUserSchema,
  RefreshTokenResponseSchema,
  SocketTokenResponseSchema,
} from '@chatbox/contracts'
import { getBffConfig } from '@chatbox/config/bff'
import { cookies } from 'next/headers'
import { v7 as uuidv7 } from 'uuid'

export type AuthResult = {
  sessionId: string
}

export async function authenticate(credentials: {
  username: string
  password: string
}): Promise<AuthResult> {
  let accessToken: string
  let refreshToken: string | undefined
  const config = getBffConfig()

  try {
    const authData = await fetchJson(
      `${config.IDENTITY_URL}${API_ROUTES.AUTH.SIGNIN}`,
      AuthResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
        unwrapSuccess: true,
      },
    )
    accessToken = authData.access_token
    refreshToken = authData.refresh_token
  } catch (error) {
    if (error instanceof FetchError && error.status === 422) {
      const authData = await fetchJson(
        `${config.IDENTITY_URL}${API_ROUTES.AUTH.SIGNUP}`,
        AuthResponseSchema,
        {
          method: 'POST',
          body: JSON.stringify(credentials),
          unwrapSuccess: true,
        },
      )
      accessToken = authData.access_token
      refreshToken = authData.refresh_token
    } else {
      throw error
    }
  }

  const sessionId = uuidv7()
  const cookieStore = await cookies()

  cookieStore.set('session', accessToken, {
    httpOnly: true,
    secure: config.AUTH_COOKIE_SECURE,
    sameSite: 'strict',
    maxAge: config.AUTH_JWT_EXPIRES_IN_SEC,
    path: '/',
  })

  if (refreshToken) {
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.AUTH_COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 604800, 
      path: '/',
    })
  }

  return { sessionId }
}

export async function getSocketToken(): Promise<{ socketToken: string }> {
  const cookieStore = await cookies()
  let sessionToken = cookieStore.get('session')?.value

  if (!sessionToken) {
    throw new Error('Unauthorized')
  }

  const config = getBffConfig()

  try {
    const data = await fetchJson(
      `${config.IDENTITY_URL}${API_ROUTES.AUTH.SOCKET_TOKEN}`,
      SocketTokenResponseSchema,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
        unwrapSuccess: true,
      },
    )
    return data
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      const newToken = await refreshSession()
      if (!newToken) {
        throw new Error('Unauthorized')
      }

      const data = await fetchJson(
        `${config.IDENTITY_URL}${API_ROUTES.AUTH.SOCKET_TOKEN}`,
        SocketTokenResponseSchema,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${newToken}` },
          unwrapSuccess: true,
        },
      )
      return data
    }
    throw error
  }
}

export async function refreshSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) {
    return null
  }

  const config = getBffConfig()

  try {
    const data = await fetchJson(
      `${config.IDENTITY_URL}${API_ROUTES.AUTH.REFRESH}`,
      RefreshTokenResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
        unwrapSuccess: true,
      },
    )

    cookieStore.set('session', data.access_token, {
      httpOnly: true,
      secure: config.AUTH_COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: config.AUTH_JWT_EXPIRES_IN_SEC,
      path: '/',
    })

    cookieStore.set('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: config.AUTH_COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 604800, 
      path: '/',
    })

    return data.access_token
  } catch (error) {
    cookieStore.delete('session')
    cookieStore.delete('refresh_token')
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (refreshToken) {
    const config = getBffConfig()
    try {
      await fetch(`${config.IDENTITY_URL}${API_ROUTES.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch (error) {
      console.error('Failed to revoke refresh token on backend:', error)
    }
  }

  cookieStore.delete('session')
  cookieStore.delete('refresh_token')
}
