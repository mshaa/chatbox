import { AuthConfig, authConfig, RedisModule } from '@chatbox/nest-infra'
import { PersistenceModule } from '@chatbox/nest-persistence'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthGuard } from './guards/auth.guard'

@Module({
  imports: [
    PersistenceModule,
    RedisModule,
    JwtModule.registerAsync({
      useFactory: (config: AuthConfig) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: `${config.jwtExpiresInSec}s` },
      }),
      inject: [authConfig.KEY],
    }),
  ],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
