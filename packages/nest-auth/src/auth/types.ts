import { Request } from 'express'

export type UserJwtPayload = {
  sub: string
  username: string
  scopes: string[]
}

export type AuthRequest = Request & {
  user: UserJwtPayload
}
