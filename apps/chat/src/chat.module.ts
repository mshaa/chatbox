import { PERSISTENCE_QUEUE } from '@chatbox/contracts'
import { AuthModule } from '@chatbox/nest-auth'
import {
  ConfigModule as AppConfigModule,
  GlobalExceptionFilter,
  LoggerModule,
  MetricsConfig,
  metricsConfig,
  MetricsModule,
  QueueConfig,
  queueConfig,
  RedisModule,
  SecurityConfig,
  securityConfig,
  TransformInterceptor,
} from '@chatbox/nest-infra'
import { PersistenceModule } from '@chatbox/nest-persistence'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { Reflector } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ZodValidationPipe } from 'nestjs-zod'
import { EventsController } from './controllers/events.controller'
import { HTTPController } from './controllers/http.controller'
import { ChatGateway } from './gateway/chat.gateway'
import { ChatMetricsModule } from './metrics/chat-metrics.module'
import { ChatService } from './services/chat.service'
import { PagerService } from './services/pager.service'
import { RoomService } from './services/room.service'
import { UserService } from './services/user.service'

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    PersistenceModule,
    LoggerModule,
    RedisModule,
    MetricsModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: MetricsConfig) => ({
        enabled: config.enabled,
        path: config.path,
        defaultMetrics: config.defaultMetrics,
        serviceName: 'chat',
      }),
      inject: [metricsConfig.KEY],
    }),
    ChatMetricsModule,
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: QueueConfig) => ({
        connection: {
          host: config.redis.host,
          port: config.redis.port,
        },
      }),
      inject: [queueConfig.KEY],
    }),
    BullModule.registerQueue({
      name: PERSISTENCE_QUEUE,
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
  controllers: [HTTPController, EventsController],
  providers: [
    ChatService,
    ChatGateway,
    PagerService,
    RoomService,
    UserService,
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
  exports: [ChatService],
})
export class ChatModule {}
