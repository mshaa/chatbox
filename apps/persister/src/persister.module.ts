import { PERSISTENCE_QUEUE, SYNC_LAST_READ_JOB } from '@chatbox/contracts'
import {
  ConfigModule as AppConfigModule,
  LoggerModule,
  MetricsConfig,
  metricsConfig,
  MetricsModule,
  type QueueConfig,
  queueConfig,
  RedisModule,
} from '@chatbox/nest-infra'
import { PersistenceModule } from '@chatbox/nest-persistence'
import { BullModule, InjectQueue } from '@nestjs/bullmq'
import { Inject, Module, OnModuleInit } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { Queue } from 'bullmq'
import { PersisterMetricsModule } from './metrics/persister-metrics.module'
import { PersistenceProcessor } from './persistence.processor'
import { PersisterController } from './persister.controller'

@Module({
  imports: [
    AppConfigModule,
    PersistenceModule,
    RedisModule,
    MetricsModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: MetricsConfig) => ({
        enabled: config.enabled,
        path: config.path,
        defaultMetrics: config.defaultMetrics,
        serviceName: 'persister',
      }),
      inject: [metricsConfig.KEY],
    }),
    PersisterMetricsModule,
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
    ClientsModule.registerAsync([
      {
        name: 'TRANSPORT_CLIENT',
        imports: [AppConfigModule],
        useFactory: (config: QueueConfig) => ({
          transport: Transport.REDIS,
          options: {
            host: config.redis.host,
            port: config.redis.port,
          },
        }),
        inject: [queueConfig.KEY],
      },
    ]),
    LoggerModule,
  ],
  controllers: [PersisterController],
  providers: [PersistenceProcessor],
})
export class PersisterModule implements OnModuleInit {
  constructor(
    @InjectQueue(PERSISTENCE_QUEUE) private readonly queue: Queue,
    @Inject(queueConfig.KEY) private readonly config: QueueConfig,
  ) { }

  async onModuleInit() {
    if (this.config.persistReadMsgId !== 'write-behind') {
      return
    }

    const [waiting, delayed, active] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getDelayed(),
      this.queue.getActive(),
    ])

    const exists = [...waiting, ...delayed, ...active].some(
      job => job.name === SYNC_LAST_READ_JOB,
    )

    if (!exists) {
      await this.queue.add(
        SYNC_LAST_READ_JOB,
        {},
        {
          removeOnComplete: true,
          removeOnFail: true,
        },
      )
    }
  }
}
