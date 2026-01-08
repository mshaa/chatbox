import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  SetMetadata,
  Type,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Scopes } from '../scopes'
import { AuthRequest, UserJwtPayload } from '../types'

const IS_PUBLIC_KEY = 'isPublic'
const IS_GUEST_ONLY_KEY = 'isGuestOnly'

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
export const GuestOnly = () => SetMetadata(IS_GUEST_ONLY_KEY, true)

export const AuthGuard = (...requiredScopes: string[]): Type<CanActivate> => {
  @Injectable()
  class AuthGuardMixin implements CanActivate {
    constructor(
      private jwtService: JwtService,
      private reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])

      const isGuestOnly = this.reflector.getAllAndOverride<boolean>(IS_GUEST_ONLY_KEY, [
        context.getHandler(),
        context.getClass(),
      ])

      const request = context.switchToHttp().getRequest<AuthRequest>()
      const token = this.extractTokenFromHeader(request)

      if (isGuestOnly) {
        if (token) {
          try {
            await this.jwtService.verifyAsync<UserJwtPayload>(token)
            throw new ForbiddenException('You are already logged in.')
          } catch (e) {
            if (e instanceof ForbiddenException) {
              throw e
            }
            return true
          }
        }
        return true
      }

      if (isPublic) {
        return true
      }

      if (!token) {
        throw new UnauthorizedException()
      }

      try {
        const payload = await this.jwtService.verifyAsync<UserJwtPayload>(token)

        if (requiredScopes.length > 0 && !this.hasRequiredScopes(payload.scopes, requiredScopes)) {
          throw new UnauthorizedException('Insufficient permissions')
        }

        request.user = payload
      } catch (error) {
        if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
          throw error
        }
        throw new UnauthorizedException()
      }

      return true
    }

    private hasRequiredScopes(userScopes: string[], required: string[]): boolean {
      if (userScopes.includes(Scopes.ALL)) {
        return true
      }

      return required.every((scope) => userScopes.includes(scope))
    }

    private extractTokenFromHeader(request: AuthRequest): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? []
      return type === 'Bearer' ? token : undefined
    }
  }

  return mixin(AuthGuardMixin)
}
