/**
 * Centralized API route definitions
 * Single source of truth for all HTTP endpoints
 */

export const API_ROUTES = {
  HEALTH: '/health',

  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout/all',
    SOCKET_TOKEN: '/auth/token/chat',
  },

  USERS: {
    ME: '/users/me',
    BY_ID: (userId: string) => `/users/${userId}`,
    ME_CHATS: '/users/me/chats',
  },

  ROOMS: {
    DISCOVER: '/rooms/discover',
    GROUP: '/rooms/group',
    DM: '/rooms/dm',
    BY_ID: {
      JOIN: (roomId: string) => `/rooms/${roomId}/join`,
      LEAVE: (roomId: string) => `/rooms/${roomId}/leave`,
      MEMBERS: (roomId: string) => `/rooms/${roomId}/members`,
      MESSAGES: (roomId: string) => `/rooms/${roomId}/messages`,
      READ: (roomId: string) => `/rooms/${roomId}/read`,
    },
  },
} as const
