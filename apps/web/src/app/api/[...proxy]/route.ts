import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getBffConfig } from '@chatbox/config/bff'
import { createLogger } from '@/lib/logger'
import { refreshSession } from '@/actions/auth'

const logger = createLogger('proxy')

const ALLOWED_PATH_PREFIXES = [
  'rooms',
  'users',
  'messages',
] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params
  return proxyRequest(request, proxy, 'GET')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params
  return proxyRequest(request, proxy, 'POST')
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params
  return proxyRequest(request, proxy, 'PUT')
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params
  return proxyRequest(request, proxy, 'DELETE')
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params
  return proxyRequest(request, proxy, 'PATCH')
}

async function proxyRequest(request: NextRequest, proxyPath: string[], method: string) {
  const path = proxyPath.join('/')

  try {
    const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))

    if (!isAllowed) {
      logger.warn(
        {
          event: 'proxy_blocked',
          path,
          method,
          userAgent: request.headers.get('user-agent'),
        },
        'Blocked proxy attempt to unauthorized path'
      )
      return NextResponse.json(
        { error: 'Forbidden', message: 'Access to this endpoint is not allowed' },
        { status: 403 }
      )
    }

    const cookieStore = await cookies()
    let sessionToken = cookieStore.get('session')?.value ?? null

    if (!sessionToken) {
      logger.debug({ event: 'proxy_attempt_refresh', path }, 'No session token, attempting refresh')
      sessionToken = await refreshSession()

      if (!sessionToken) {
        logger.debug({ event: 'proxy_refresh_failed', path }, 'Token refresh failed')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      logger.debug({ event: 'proxy_refresh_success', path }, 'Token refreshed successfully')
    }

    const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined

    logger.debug({ event: 'proxy_request', path, method }, 'Forwarding request to backend')

    const config = getBffConfig()
    const response = await fetch(`${config.CHAT_URL}/${path}${request.nextUrl.search}`, {
      method,
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    if (response.status === 401) {
      logger.info({ event: 'backend_401', path }, 'Backend returned 401, attempting refresh')

      const newToken = await refreshSession()
      if (newToken) {
        const retryResponse = await fetch(`${config.CHAT_URL}/${path}${request.nextUrl.search}`, {
          method,
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
          body,
        })

        logger.debug(
          { event: 'proxy_retry_response', path, method, status: retryResponse.status },
          'Retry backend response received',
        )

        const retryData = await retryResponse.json()
        return NextResponse.json(retryData, { status: retryResponse.status })
      }

      logger.info({ event: 'refresh_failed_401', path }, 'Token refresh failed after 401')
      cookieStore.delete('session')
      cookieStore.delete('refresh_token')
    }

    logger.debug(
      { event: 'proxy_response', path, method, status: response.status },
      'Backend response received',
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    logger.error(
      {
        event: 'proxy_error',
        path,
        method,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      },
      'Proxy request failed'
    )
    return NextResponse.json({ error: 'Backend request failed' }, { status: 500 })
  }
}
