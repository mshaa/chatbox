import { Module } from '@nestjs/common'
import { Request } from 'express'
import { Logger, PinoLogger, LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { CommonConfig, commonConfig } from '../config';

export class AppLogger extends PinoLogger { }
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [commonConfig.KEY],
      useFactory: async (config: CommonConfig) => ({
        pinoHttp: {
          level: config.env !== 'production' ? 'debug' : 'error',
          autoLogging: false,
          formatters: {
            level: (label) => ({ level: label }),
          },
          serializers: {
            req: (req: Request) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
          },
          transport: (config.env !== 'production')
            ? {
              target: 'pino-pretty', options: {
                singleLine: false,
              },
            }
            : undefined,
        },
      })
    })
  ],
  providers: [
    {
      provide: AppLogger,
      useExisting: Logger,
    },
  ],
  exports: [PinoLoggerModule, AppLogger],
})
export class LoggerModule { }
