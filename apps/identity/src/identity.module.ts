import { AuthModule } from '@chatbox/nest-auth'
import {
  ConfigModule as AppConfigModule,
  GlobalExceptionFilter,
  LoggerModule,
  MetricsConfig,
  metricsConfig,
  MetricsModule,
  SecurityConfig,
  securityConfig,
  TransformInterceptor,
} from '@chatbox/nest-infra'
import { PersistenceModule } from '@chatbox/nest-persistence'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { Reflector } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ZodValidationPipe } from 'nestjs-zod'
import { IdentityController } from './identity.controller'

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    LoggerModule,
    PersistenceModule,
    MetricsModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: MetricsConfig) => ({
        enabled: config.enabled,
        path: config.path,
        defaultMetrics: config.defaultMetrics,
        serviceName: 'identity',
      }),
      inject: [metricsConfig.KEY],
    }),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: SecurityConfig) => ({
        throttlers: [
          {
            ttl: config.throttle.ttl,
            limit: config.throttle.limit,
          },
        ],
        skipIf: () => !config.throttle.enabled,
      }),
      inject: [securityConfig.KEY],
    }),
  ],
  controllers: [IdentityController],
  providers: [
    Reflector,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class IdentityModule {}
