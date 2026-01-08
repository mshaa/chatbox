import { Global, Module } from '@nestjs/common'
import { PersisterMetricsService } from './persister-metrics.service'

@Global()
@Module({
  providers: [PersisterMetricsService],
  exports: [PersisterMetricsService],
})
export class PersisterMetricsModule {}
