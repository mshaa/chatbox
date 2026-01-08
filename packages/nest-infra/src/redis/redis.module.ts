import { Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { RedisProvider, RedisService } from './redis.provider'

@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisProvider],
  exports: [RedisService, RedisProvider],
})
export class RedisModule {}
