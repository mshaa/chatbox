import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

type ErrorResponse = {
  success: false
  statusCode: number
  payload: {
    message: string | string[]
    errorCode?: string
  }
  path: string
  timestamp: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'
    let errorCode: string | undefined

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Handle Zod validation errors and NestJS validation pipe errors
        const responseObj = exceptionResponse as Record<string, any>
        message = responseObj.message || message
        errorCode = responseObj.error || responseObj.errorCode
      }
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack)
    } else {
      this.logger.error('Unknown exception type', exception)
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      payload: {
        message,
        errorCode,
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    }

    response.status(statusCode).json(errorResponse)
  }
}
