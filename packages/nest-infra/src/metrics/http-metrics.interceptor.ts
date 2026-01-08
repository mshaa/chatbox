import {
  Inject,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import type { Request, Response } from 'express'
import { MetricsService } from './metrics.service'
import { MetricsModuleOptions } from './metrics.module'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
    @Optional() @Inject('METRICS_OPTIONS') private readonly options: MetricsModuleOptions | null,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.metricsService.isEnabled) {
      return next.handle()
    }

    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // Skip metrics endpoint itself
    const metricsPath = this.options?.path ?? '/metrics'
    if (request.path === metricsPath) {
      return next.handle()
    }

    const method = request.method
    const route = this.getRoute(context, request)

    // Increment in-flight requests
    this.metricsService.incHttpInFlight(method)

    const startTime = process.hrtime()

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(method, route, response.statusCode, startTime)
        },
        error: (error) => {
          const statusCode = error.status || error.statusCode || 500
          this.recordMetrics(method, route, statusCode, startTime)
        },
      }),
    )
  }

  private recordMetrics(
    method: string,
    route: string,
    statusCode: number,
    startTime: [number, number],
  ) {
    const [seconds, nanoseconds] = process.hrtime(startTime)
    const duration = seconds + nanoseconds / 1e9

    this.metricsService.observeHttpDuration(method, route, statusCode, duration)
    this.metricsService.incHttpTotal(method, route, statusCode)
    this.metricsService.decHttpInFlight(method)
  }

  private getRoute(context: ExecutionContext, request: Request): string {
    const controller = context.getClass()
    const handler = context.getHandler()

    const controllerPath = Reflect.getMetadata('path', controller) || ''
    const handlerPath = Reflect.getMetadata('path', handler) || ''

    if (controllerPath || handlerPath) {
      const fullPath = `/${controllerPath}/${handlerPath}`
        .replace(/\/+/g, '/')
        .replace(/\/$/, '')
      return fullPath || '/'
    }

    return this.normalizePath(request.path)
  }

  private normalizePath(path: string): string {
    return path
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ':id',
      )
      .replace(/\/\d+/g, '/:id')
  }
}
