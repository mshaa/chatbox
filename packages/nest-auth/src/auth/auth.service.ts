import { UserService } from '@chatbox/nest-persistence'
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { v7 } from 'uuid'
import { Scopes } from './scopes'
import { UserJwtPayload } from './types'
import { type AuthConfig, authConfig, RedisToken } from '@chatbox/nest-infra'
import { cacheKeyRefreshToken, cacheKeyUserTokens } from '@chatbox/contracts'
import type Redis from 'ioredis'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly config: AuthConfig,
    @Inject(RedisToken)
    private readonly redis: Redis,
  ) {}

  async signUp(username: string, pass: string): Promise<{ access_token: string; refresh_token: string }> {
    const isExists = await this.userService.findUserByUsername(username)
    if (isExists) {
      this.logger.warn({ username }, 'Sign up failed: user already exists')
      throw new UnauthorizedException('User already exists')
    }
    const passwordHash = await argon2.hash(pass, {
      memoryCost: this.config.argon2MemoryCost,
      timeCost: this.config.argon2TimeCost,
      parallelism: this.config.argon2Parallelism,
    })
    const avatarId = Math.floor(Math.random() * 70) + 1
    const user = await this.userService.createUser({
      userId: v7(),
      username,
      passwordHash,
      avatar: `https://i.pravatar.cc/150?img=${avatarId}`,
      createdAt: new Date(),
    })
    this.logger.debug({ userId: user.userId, username }, 'New user created')
    const payload: UserJwtPayload = {
      sub: user.userId,
      username: user.username,
      scopes: [Scopes.ALL],
    }

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.config.accessTokenExpiresInSec}s`,
    })
    const refresh_token = await this.createRefreshToken(user.userId)

    return { access_token, refresh_token }
  }

  async signIn(username: string, pass: string): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findUserByUsername(username)
    if (!user) {
      this.logger.warn({ username }, 'Sign in failed: user not found')
      throw new UnprocessableEntityException()
    }
    const isMatch = await argon2.verify(user.passwordHash, pass)
    if (!isMatch) {
      this.logger.warn({ username }, 'Sign in failed: invalid password')
      throw new UnauthorizedException()
    }
    const payload: UserJwtPayload = {
      sub: user.userId,
      username: user.username,
      scopes: [Scopes.ALL],
    }

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.config.accessTokenExpiresInSec}s`,
    })
    const refresh_token = await this.createRefreshToken(user.userId)

    return { access_token, refresh_token }
  }

  async verifyToken(token: string): Promise<UserJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<UserJwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }

  async createSocketToken(payload: UserJwtPayload): Promise<string> {
    const socketPayload: UserJwtPayload = {
      sub: payload.sub,
      username: payload.username,
      scopes: [Scopes.SOCKET_CHAT],
    }

    return this.jwtService.signAsync(socketPayload, {
      expiresIn: `${this.config.socketTokenExpiresInSec}s`,
    })
  }

  async verifyTokenWithScopes(token: string, requiredScopes: string[]): Promise<UserJwtPayload> {
    const payload = await this.verifyToken(token)

    if (payload.scopes.includes(Scopes.ALL)) {
      return payload
    }

    const hasAllScopes = requiredScopes.every((scope) => payload.scopes.includes(scope))

    if (hasAllScopes) {
      return payload
    }

    const missingScopes = requiredScopes.filter((scope) => !payload.scopes.includes(scope))
    throw new UnauthorizedException(
      `Scope check failed. Required scopes: [${requiredScopes.join(', ')}], Provided: [${payload.scopes.join(', ')}], Missing: [${missingScopes.join(', ')}]`,
    )
  }

  async createRefreshToken(userId: string): Promise<string> {
    const tokenId = v7()
    const expiresAt = Date.now() + this.config.refreshTokenExpiresInSec * 1000

    const tokenData = {
      userId,
      issuedAt: Date.now(),
      expiresAt,
      used: false,
    }

    const pipeline = this.redis.pipeline()
    pipeline.setex(
      cacheKeyRefreshToken(tokenId),
      this.config.refreshTokenExpiresInSec,
      JSON.stringify(tokenData),
    )
    pipeline.sadd(cacheKeyUserTokens(userId), tokenId)
    pipeline.expire(cacheKeyUserTokens(userId), this.config.refreshTokenExpiresInSec)
    await pipeline.exec()

    this.logger.debug({ userId, tokenId }, 'Refresh token created')
    return tokenId
  }

  async rotateRefreshToken(oldTokenId: string): Promise<{ access_token: string; refresh_token: string }> {
    const tokenDataStr = await this.redis.get(cacheKeyRefreshToken(oldTokenId))

    if (!tokenDataStr) {
      this.logger.warn({ tokenId: oldTokenId }, 'Refresh token not found or expired')
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const tokenData = JSON.parse(tokenDataStr)

    if (tokenData.used) {
      const timeSinceUse = Date.now() - tokenData.usedAt
      const reuseWindowMs = this.config.refreshTokenReuseWindowSec * 1000

      if (timeSinceUse < reuseWindowMs) {
        this.logger.warn(
          { userId: tokenData.userId, tokenId: oldTokenId, timeSinceUse },
          'Refresh token reused within grace period (possible retry)',
        )
      } else {
        this.logger.error(
          { userId: tokenData.userId, tokenId: oldTokenId },
          'SECURITY: Refresh token reuse detected - revoking all user tokens',
        )
        await this.revokeAllUserTokens(tokenData.userId)
        throw new UnauthorizedException('Token reuse detected - all sessions revoked')
      }
    }

    tokenData.used = true
    tokenData.usedAt = Date.now()
    const pipeline = this.redis.pipeline()
    pipeline.setex(
      cacheKeyRefreshToken(oldTokenId),
      this.config.refreshTokenReuseWindowSec,
      JSON.stringify(tokenData),
    )
    pipeline.srem(cacheKeyUserTokens(tokenData.userId), oldTokenId)
    await pipeline.exec()

    const user = await this.userService.findUserById(tokenData.userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const payload: UserJwtPayload = {
      sub: user.userId,
      username: user.username,
      scopes: [Scopes.ALL],
    }
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.config.accessTokenExpiresInSec}s`,
    })

    const refresh_token = await this.createRefreshToken(user.userId)

    this.logger.debug(
      { userId: user.userId, oldTokenId, newTokenId: refresh_token },
      'Refresh token rotated',
    )

    return { access_token, refresh_token }
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    const tokenDataStr = await this.redis.get(cacheKeyRefreshToken(tokenId))
    if (tokenDataStr) {
      const tokenData = JSON.parse(tokenDataStr)
      const pipeline = this.redis.pipeline()
      pipeline.del(cacheKeyRefreshToken(tokenId))
      pipeline.srem(cacheKeyUserTokens(tokenData.userId), tokenId)
      await pipeline.exec()
      this.logger.debug({ tokenId, userId: tokenData.userId }, 'Refresh token revoked')
    } else {
      await this.redis.del(cacheKeyRefreshToken(tokenId))
      this.logger.debug({ tokenId }, 'Refresh token revoked (no data found)')
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokenIds = await this.redis.smembers(cacheKeyUserTokens(userId))

    if (tokenIds.length === 0) {
      this.logger.warn({ userId, revokedCount: 0 }, 'No refresh tokens found for user')
      return
    }

    const pipeline = this.redis.pipeline()
    for (const tokenId of tokenIds) {
      pipeline.del(cacheKeyRefreshToken(tokenId))
    }
    pipeline.del(cacheKeyUserTokens(userId))
    await pipeline.exec()

    this.logger.warn({ userId, revokedCount: tokenIds.length }, 'All user refresh tokens revoked')
  }
}
