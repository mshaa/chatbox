/**
 * JWT Scopes for access control
 *
 * Scopes define what actions a token can perform:
 * - ALL: God scope - grants access to everything
 * - API: HTTP API access (REST endpoints)
 * - SOCKET_CHAT: WebSocket chat connection access
 */
export const Scopes = {
  ALL: 'all',
  API: 'api',
  SOCKET_CHAT: 'socket:chat',
} as const

export type Scope = (typeof Scopes)[keyof typeof Scopes]
