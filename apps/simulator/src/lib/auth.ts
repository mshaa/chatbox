import { getSimulatorAppConfig } from '../config/simulator.config'

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export async function loginBot(username: string, password: string = 'password'): Promise<AuthTokens> {
  const config = getSimulatorAppConfig()
  const response = await fetch(`${config.identityUrl}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(`Failed to login as ${username}: ${response.statusText}`)
  }

  const data = (await response.json()).data as AuthTokens
  return data
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const config = getSimulatorAppConfig()
  const response = await fetch(`${config.identityUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`)
  }

  const data = (await response.json()).data as AuthTokens
  return data
}
