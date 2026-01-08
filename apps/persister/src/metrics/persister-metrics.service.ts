import {
  METRIC_BULLMQ_JOBS_TOTAL,
  METRIC_BULLMQ_JOB_DURATION,
  METRIC_BULLMQ_QUEUE_DEPTH,
  METRIC_CHAT_MESSAGES_TOTAL,
  HISTOGRAM_BUCKETS_JOB,
  LABEL_QUEUE,
  LABEL_JOB,
  LABEL_STATUS,
  LABEL_STATE,
} from '@chatbox/contracts'
import { MetricsModuleOptions } from '@chatbox/nest-infra'
import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import { Counter, Histogram, Gauge } from 'prom-client'

const SERVICE_NAME = 'persister'

@Injectable()
export class PersisterMetricsService implements OnModuleInit {
  private bullmqJobsTotal: Counter<string> | null = null
  private bullmqJobDuration: Histogram<string> | null = null
  private bullmqQueueDepth: Gauge<string> | null = null
  private messagesTotal: Counter<string> | null = null

  constructor(
    @Optional() @Inject('METRICS_OPTIONS') private readonly options: MetricsModuleOptions | null,
  ) {}

  onModuleInit() {
    if (!this.options?.enabled) return

    const prefix = `${SERVICE_NAME}_`

    this.bullmqJobsTotal = new Counter({
      name: `${prefix}${METRIC_BULLMQ_JOBS_TOTAL}`,
      help: 'Total BullMQ jobs',
      labelNames: [LABEL_QUEUE, LABEL_JOB, LABEL_STATUS],
    })

    this.bullmqJobDuration = new Histogram({
      name: `${prefix}${METRIC_BULLMQ_JOB_DURATION}`,
      help: 'Duration of BullMQ job processing in seconds',
      labelNames: [LABEL_QUEUE, LABEL_JOB],
      buckets: HISTOGRAM_BUCKETS_JOB,
    })

    this.bullmqQueueDepth = new Gauge({
      name: `${prefix}${METRIC_BULLMQ_QUEUE_DEPTH}`,
      help: 'Current number of jobs in queue',
      labelNames: [LABEL_QUEUE, LABEL_STATE],
    })

    this.messagesTotal = new Counter({
      name: `${prefix}${METRIC_CHAT_MESSAGES_TOTAL}`,
      help: 'Total messages persisted',
    })
  }

  onJobStarted(queue: string, job: string) {
    this.bullmqJobsTotal?.inc({ [LABEL_QUEUE]: queue, [LABEL_JOB]: job, [LABEL_STATUS]: 'started' })
  }

  onJobCompleted(queue: string, job: string) {
    this.bullmqJobsTotal?.inc({ [LABEL_QUEUE]: queue, [LABEL_JOB]: job, [LABEL_STATUS]: 'completed' })
  }

  onJobFailed(queue: string, job: string) {
    this.bullmqJobsTotal?.inc({ [LABEL_QUEUE]: queue, [LABEL_JOB]: job, [LABEL_STATUS]: 'failed' })
  }

  observeJobDuration(queue: string, job: string, durationSec: number) {
    this.bullmqJobDuration?.observe({ [LABEL_QUEUE]: queue, [LABEL_JOB]: job }, durationSec)
  }

  setQueueDepth(queue: string, state: 'waiting' | 'active' | 'delayed', count: number) {
    this.bullmqQueueDepth?.set({ [LABEL_QUEUE]: queue, [LABEL_STATE]: state }, count)
  }

  startJobTimer(queue: string, job: string): () => void {
    const start = process.hrtime()
    this.onJobStarted(queue, job)
    return () => {
      const [seconds, nanoseconds] = process.hrtime(start)
      const duration = seconds + nanoseconds / 1e9
      this.observeJobDuration(queue, job, duration)
    }
  }

  onMessagePersisted() {
    this.messagesTotal?.inc()
  }
}
