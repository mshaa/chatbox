import {
  METRIC_WS_CONNECTIONS_ACTIVE,
  METRIC_WS_CONNECTIONS_TOTAL,
  METRIC_WS_EVENTS_TOTAL,
  METRIC_WS_EVENT_DURATION,
  METRIC_CHAT_ROOMS_CREATED_TOTAL,
  METRIC_CHAT_ROOM_JOINS_TOTAL,
  METRIC_CHAT_ROOM_LEAVES_TOTAL,
  METRIC_BULLMQ_JOBS_TOTAL,
  HISTOGRAM_BUCKETS_WS,
  LABEL_EVENT,
  LABEL_EVENT_TYPE,
  LABEL_TYPE,
  LABEL_QUEUE,
  LABEL_JOB,
  LABEL_STATUS,
} from '@chatbox/contracts'
import { MetricsModuleOptions } from '@chatbox/nest-infra'
import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import { Counter, Histogram, Gauge } from 'prom-client'

const SERVICE_NAME = 'chat'

@Injectable()
export class ChatMetricsService implements OnModuleInit {
  private wsConnectionsActive: Gauge<string> | null = null
  private wsConnectionsTotal: Counter<string> | null = null
  private wsEventsTotal: Counter<string> | null = null
  private wsEventDuration: Histogram<string> | null = null
  private roomsCreatedTotal: Counter<string> | null = null
  private roomJoinsTotal: Counter<string> | null = null
  private roomLeavesTotal: Counter<string> | null = null
  private bullmqJobsTotal: Counter<string> | null = null

  constructor(
    @Optional() @Inject('METRICS_OPTIONS') private readonly options: MetricsModuleOptions | null,
  ) {}

  onModuleInit() {
    if (!this.options?.enabled) return

    const prefix = `${SERVICE_NAME}_`

    this.wsConnectionsActive = new Gauge({
      name: `${prefix}${METRIC_WS_CONNECTIONS_ACTIVE}`,
      help: 'Number of active WebSocket connections',
    })

    this.wsConnectionsTotal = new Counter({
      name: `${prefix}${METRIC_WS_CONNECTIONS_TOTAL}`,
      help: 'Total WebSocket connection events',
      labelNames: [LABEL_EVENT],
    })

    this.wsEventsTotal = new Counter({
      name: `${prefix}${METRIC_WS_EVENTS_TOTAL}`,
      help: 'Total WebSocket events processed',
      labelNames: [LABEL_EVENT_TYPE],
    })

    this.wsEventDuration = new Histogram({
      name: `${prefix}${METRIC_WS_EVENT_DURATION}`,
      help: 'Duration of WebSocket event handlers in seconds',
      labelNames: [LABEL_EVENT_TYPE],
      buckets: HISTOGRAM_BUCKETS_WS,
    })

    this.roomsCreatedTotal = new Counter({
      name: `${prefix}${METRIC_CHAT_ROOMS_CREATED_TOTAL}`,
      help: 'Total rooms created',
      labelNames: [LABEL_TYPE],
    })

    this.roomJoinsTotal = new Counter({
      name: `${prefix}${METRIC_CHAT_ROOM_JOINS_TOTAL}`,
      help: 'Total room join events',
    })

    this.roomLeavesTotal = new Counter({
      name: `${prefix}${METRIC_CHAT_ROOM_LEAVES_TOTAL}`,
      help: 'Total room leave events',
    })

    this.bullmqJobsTotal = new Counter({
      name: `${prefix}${METRIC_BULLMQ_JOBS_TOTAL}`,
      help: 'Total BullMQ jobs added',
      labelNames: [LABEL_QUEUE, LABEL_JOB, LABEL_STATUS],
    })
  }

  onWsConnect() {
    this.wsConnectionsActive?.inc()
    this.wsConnectionsTotal?.inc({ [LABEL_EVENT]: 'connect' })
  }

  onWsDisconnect() {
    this.wsConnectionsActive?.dec()
    this.wsConnectionsTotal?.inc({ [LABEL_EVENT]: 'disconnect' })
  }

  onWsEvent(eventType: string) {
    this.wsEventsTotal?.inc({ [LABEL_EVENT_TYPE]: eventType })
  }

  onRoomCreated(type: 'dm' | 'group') {
    this.roomsCreatedTotal?.inc({ [LABEL_TYPE]: type })
  }

  onRoomJoin() {
    this.roomJoinsTotal?.inc()
  }

  onRoomLeave() {
    this.roomLeavesTotal?.inc()
  }

  onJobAdded(queue: string, job: string) {
    this.bullmqJobsTotal?.inc({ [LABEL_QUEUE]: queue, [LABEL_JOB]: job, [LABEL_STATUS]: 'added' })
  }
}
