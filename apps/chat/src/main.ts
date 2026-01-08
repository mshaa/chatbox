import { AppLogger, ChatConfig, chatConfig, QueueConfig, queueConfig, SecurityConfig, securityConfig } from '@chatbox/nest-infra'
import { INestApplication } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'
import { Transport } from '@nestjs/microservices'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import helmet from 'helmet'
import { Redis } from 'ioredis'
import { Server, ServerOptions } from 'socket.io'
import { ChatModule } from './chat.module'
import { ExpressAdapter } from '@nestjs/platform-express'

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>

  constructor(
    private readonly queueConfig: QueueConfig,
    app: INestApplication,
  ) {
    super(app)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(this.queueConfig.redis)
    const subClient = pubClient.duplicate()
    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as Server
    server.adapter(this.adapterConstructor)
    return server
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ChatModule, { bufferLogs: false, bodyParser: false })
  app.useLogger(app.get(AppLogger))

  // Trust proxy for correct client IP behind Traefik
  app.set('trust proxy', 1)

  const config: ChatConfig = app.get(chatConfig.KEY)
  const queueConf: QueueConfig = app.get(queueConfig.KEY)
  const securityConf: SecurityConfig = app.get(securityConfig.KEY)

  app.use(
    helmet({
      contentSecurityPolicy: false, 
    }),
  )

  app.useBodyParser('json', { limit: securityConf.bodySizeLimit })
  app.useBodyParser('urlencoded', { extended: true, limit: securityConf.bodySizeLimit })

  const adapter = new RedisIoAdapter(queueConf, app)
  await adapter.connectToRedis()

  app.useWebSocketAdapter(adapter)

  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: queueConf.redis.host,
      port: queueConf.redis.port,
    },
  })

  process.on('SIGINT', async () => {
    await app.close()
    process.exit(0)
  })

  await app.startAllMicroservices()
  await app.listen(config.port)
}
void bootstrap()
