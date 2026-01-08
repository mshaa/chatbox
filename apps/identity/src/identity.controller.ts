import { AuthGuard, type AuthRequest, AuthService, GuestOnly, Public, Scopes } from '@chatbox/nest-auth'
import {
  API_ROUTES,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  SocketTokenResponseSchema,
} from '@chatbox/contracts'
import { ValidateResponse } from '@chatbox/nest-infra'
import { Body, Controller, Get, HttpCode, Logger, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { SignInDto } from './dto/sign-in.dto'
import { SignUpDto } from './dto/sign-up.dto'

@Controller()
export class IdentityController {
  private readonly logger = new Logger(IdentityController.name)

  constructor(private readonly authService: AuthService) {}

  @Get(API_ROUTES.HEALTH)
  @HttpCode(204)
  health(): void {}

  // @issue: values must match THROTTLE_AUTH_LIMIT/.env (decorators evaluated at compile time)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @GuestOnly()
  @ValidateResponse(AuthResponseSchema)
  @Post(API_ROUTES.AUTH.SIGNUP)
  async signUp(@Body() { username, password }: SignUpDto) {
    this.logger.debug({ username }, 'User sign up attempt')
    const result = await this.authService.signUp(username, password)
    this.logger.debug({ username }, 'User signed up successfully')
    return result
  }

  // @issue: values must match THROTTLE_AUTH_LIMIT/.env (decorators evaluated at compile time)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @GuestOnly()
  @HttpCode(200)
  @ValidateResponse(AuthResponseSchema)
  @Post(API_ROUTES.AUTH.SIGNIN)
  async signIn(@Body() { username, password }: SignInDto) {
    this.logger.debug({ username }, 'User login attempt')
    const result = await this.authService.signIn(username, password)
    this.logger.debug({ username }, 'User logged in successfully')
    return result
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 20 refreshes per minute
  @Public()
  @HttpCode(200)
  @ValidateResponse(RefreshTokenResponseSchema)
  @Post(API_ROUTES.AUTH.REFRESH)
  async refresh(@Body() { refresh_token }: { refresh_token: string }) {
    this.logger.debug({ refreshTokenId: refresh_token }, 'Token refresh attempt')
    const result = await this.authService.rotateRefreshToken(refresh_token)
    this.logger.debug('Token refreshed successfully')
    return result
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 10 logouts per minute
  @Public()
  @HttpCode(204)
  @Post(API_ROUTES.AUTH.LOGOUT)
  async logout(@Body() { refresh_token }: { refresh_token: string }) {
    this.logger.debug({ refreshTokenId: refresh_token }, 'Logout attempt')
    await this.authService.revokeRefreshToken(refresh_token)
    this.logger.debug('Refresh token revoked successfully')
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 5 logout-all per minute
  @UseGuards(AuthGuard(Scopes.API))
  @HttpCode(204)
  @Post(API_ROUTES.AUTH.LOGOUT_ALL)
  async logoutAll(@Req() req: AuthRequest) {
    this.logger.debug({ userId: req.user.sub }, 'Logout all devices attempt')
    await this.authService.revokeAllUserTokens(req.user.sub)
    this.logger.debug({ userId: req.user.sub }, 'All refresh tokens revoked successfully')
  }

  @UseGuards(AuthGuard(Scopes.API))
  @HttpCode(200)
  @ValidateResponse(SocketTokenResponseSchema)
  @Post(API_ROUTES.AUTH.SOCKET_TOKEN)
  async getSocketToken(@Req() req: AuthRequest) {
    this.logger.debug({ userId: req.user.sub }, 'Creating socket chat token')
    const socketToken = await this.authService.createSocketToken(req.user)
    return { socketToken }
  }
}
