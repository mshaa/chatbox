import pino from 'pino'

// Pattern matches nest-infra logger 
export const logger = pino({
  level: process.env.NODE_ENV !== 'production' ? 'debug' : 'error',
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            singleLine: false,
          },
        }
      : undefined,
})

export const createLogger = (module: string) => logger.child({ module })
