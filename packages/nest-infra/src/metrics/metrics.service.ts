import {
  METRIC_HTTP_REQUEST_DURATION,
  METRIC_HTTP_REQUESTS_IN_FLIGHT,
  METRIC_HTTP_REQUESTS_TOTAL,
  HISTOGRAM_BUCKETS_HTTP,
  LABEL_METHOD,
  LABEL_ROUTE,
  LABEL_STATUS_CODE,
} from '@chatbox/contracts'
import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import { Counter, Histogram, Gauge, Registry } from 'prom-client'
import { MetricsModuleOptions } from './metrics.module'

@Injectable()
export class MetricsService implements OnModuleInit {
  private httpDuration: Histogram<string> | null = null
  private httpTotal: Counter<string> | null = null
  private httpInFlight: Gauge<string> | null = null
  private _serviceName: string = 'app'

  constructor(
    @Optional() @Inject('METRICS_OPTIONS') private readonly options: MetricsModuleOptions | null,
  ) {}

  onModuleInit() {
    if (!this.options?.enabled) return

    this._serviceName = this.options.serviceName
    const prefix = `${this._serviceName}_`

    this.httpDuration = new Histogram({
      name: `${prefix}${METRIC_HTTP_REQUEST_DURATION}`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: [LABEL_METHOD, LABEL_ROUTE, LABEL_STATUS_CODE],
      buckets: HISTOGRAM_BUCKETS_HTTP,
    })

    this.httpTotal = new Counter({
      name: `${prefix}${METRIC_HTTP_REQUESTS_TOTAL}`,
      help: 'Total number of HTTP requests',
      labelNames: [LABEL_METHOD, LABEL_ROUTE, LABEL_STATUS_CODE],
    })

    this.httpInFlight = new Gauge({
      name: `${prefix}${METRIC_HTTP_REQUESTS_IN_FLIGHT}`,
      help: 'Number of HTTP requests currently being processed',
      labelNames: [LABEL_METHOD],
    })
  }

  get isEnabled(): boolean {
    return this.options?.enabled ?? false
  }

  get serviceName(): string {
    return this._serviceName
  }

  incHttpInFlight(method: string) {
    this.httpInFlight?.inc({ [LABEL_METHOD]: method })
  }

  decHttpInFlight(method: string) {
    this.httpInFlight?.dec({ [LABEL_METHOD]: method })
  }

  observeHttpDuration(method: string, route: string, statusCode: number, durationSec: number) {
    this.httpDuration?.observe(
      {
        [LABEL_METHOD]: method,
        [LABEL_ROUTE]: route,
        [LABEL_STATUS_CODE]: String(statusCode),
      },
      durationSec,
    )
  }

  incHttpTotal(method: string, route: string, statusCode: number) {
    this.httpTotal?.inc({
      [LABEL_METHOD]: method,
      [LABEL_ROUTE]: route,
      [LABEL_STATUS_CODE]: String(statusCode),
    })
  }
}
