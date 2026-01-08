import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { authConfig, chatConfig, commonConfig, identityConfig, metricsConfig, persistenceConfig, queueConfig, securityConfig } from './config'

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [commonConfig, authConfig, persistenceConfig, queueConfig, chatConfig, identityConfig, securityConfig, metricsConfig],
    }),
  ],
})
export class ConfigModule {}
