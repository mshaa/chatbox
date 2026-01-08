import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
  Optional,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { z } from 'zod'
import { SKIP_WRAPPER_KEY } from './skip-wrapper.decorator'
import { RESPONSE_SCHEMA_KEY } from './validate-response.decorator'

export type SuccessResponse<T> = {
  success: true
  statusCode: number
  data: T
  timestamp: string
}

interface MetricsOptions {
  path?: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  private readonly logger = new Logger(TransformInterceptor.name)

  constructor(
    private reflector: Reflector,
    @Optional() @Inject('METRICS_OPTIONS') private readonly metricsOptions: MetricsOptions | null,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    const skipWrapper = this.reflector.getAllAndOverride<boolean>(SKIP_WRAPPER_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (skipWrapper) {
      return next.handle()
    }

    // Skip metrics endpoint - returns plain text for Prometheus
    const request = context.switchToHttp().getRequest<Request>()
    const metricsPath = this.metricsOptions?.path ?? '/metrics'
    if (request.path === metricsPath) {
      return next.handle()
    }

    // Get response schema if @ValidateResponse decorator is present
    const responseSchema = this.reflector.getAllAndOverride<z.ZodTypeAny>(RESPONSE_SCHEMA_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const response = context.switchToHttp().getResponse()
    const statusCode = response.statusCode

    return next.handle().pipe(
      map((data) => {
        if (responseSchema) {
          const parseResult = responseSchema.safeParse(data)
          if (!parseResult.success) {
            this.logger.error(
              `Response validation failed for ${context.getClass().name}.${context.getHandler().name}`,
              parseResult.error,
            )
            throw new InternalServerErrorException('Response validation failed')
          }
          data = parseResult.data
        }

        return {
          success: true,
          statusCode,
          data,
          timestamp: new Date().toISOString(),
        }
      }),
    )
  }
}
