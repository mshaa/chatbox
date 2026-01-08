import { Global, Module } from '@nestjs/common'
import { ChatMetricsService } from './chat-metrics.service'

@Global()
@Module({
  providers: [ChatMetricsService],
  exports: [ChatMetricsService],
})
export class ChatMetricsModule {}
